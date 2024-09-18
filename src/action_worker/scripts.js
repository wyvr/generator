import { join } from 'node:path';
import { FOLDER_GEN_JS, FOLDER_JS } from '../constants/folder.js';
import { build } from '../utils/build.js';
import { get_error_message } from '../utils/error.js';
import { read, to_extension, write } from '../utils/file.js';
import { stringify } from '../utils/json.js';
import { Logger } from '../utils/logger.js';
import { write_identifier_structure } from '../utils/structure.js';
import { to_dirname, to_relative_path_of_gen } from '../utils/to.js';
import { filled_array, filled_string, is_null } from '../utils/validate.js';
import { Cwd } from '../vars/cwd.js';
import { Env } from '../vars/env.js';
import { ReleasePath } from '../vars/release_path.js';
import { build_file, insert_script_import, write_file } from '../utils/script.js';
import { UniqId } from '../vars/uniq_id.js';
import { optimize_js } from '../utils/optimize/js.js';
import { Dependency } from '../model/dependency.js';
import { get_render_dependency_wyvr_files } from '../utils/dependency.js';

const __dirname = to_dirname(import.meta.url);
const lib_dir = join(__dirname, '..');
const resouce_dir = join(lib_dir, 'resource');
// const package_tree_db = new KeyValue(STORAGE_PACKAGE_TREE);

export async function scripts(identifiers) {
    const dep_db = new Dependency();
    const index = dep_db.get_index();
    if (!filled_array(identifiers)) {
        return;
    }
    // const package_tree = Env.is_dev() ? package_tree_db.all() : undefined;
    const build_id = UniqId.get();
    const build_id_var = `window.build_id = '${build_id ? build_id.substr(0, 8) : '_'}';`;
    const base_scripts = [
        build_id_var,
        insert_script_import(join(resouce_dir, 'events.js')),
        insert_script_import(join(resouce_dir, 'stack.js')),
        insert_script_import(join(resouce_dir, 'i18n.js')),
        insert_script_import(join(resouce_dir, 'store_init.js'))
    ];
    for (const identifier of identifiers) {
        if (is_null(identifier)) {
            Logger.warning('empty identifier found');
            continue;
        }
        let result = { code: '', sourcemap: '' };
        let gen_identifier_file;
        // let dependencies = [];
        let content;
        const scripts = [...base_scripts];

        const dependency_list = [];
        try {
            const is_shortcode = !!identifier.imports;
            // shortcode dependencies
            if (is_shortcode) {
                for (const file of Object.values(identifier.imports)) {
                    dependency_list.push(...get_render_dependency_wyvr_files(to_relative_path_of_gen(file), index));
                }
            } else {
                for (const type of ['doc', 'layout', 'page']) {
                    if (!identifier[type]) {
                        continue;
                    }
                    const file = `src/${type}/${to_extension(identifier[type], 'svelte')}`;
                    dependency_list.push(...get_render_dependency_wyvr_files(file, index));
                }
            }

            // write dev structure
            // @TODO memory leak ahead inside get_structure
            // write_identifier_structure(identifier, tree, file_config, package_tree);

            const has = {
                class: true
            };
            // build file content
            content = (
                await Promise.all(
                    dependency_list.map(async (file) => {
                        const file_result = await build_file(file, resouce_dir);
                        if (!file_result) {
                            return undefined;
                        }
                        // write files
                        write_file(file_result);
                        // apply additive has values
                        if (file_result.has) {
                            for (const key of Object.keys(file_result.has)) {
                                if (file_result.has[key]) {
                                    has[key] = file_result.has[key];
                                }
                            }
                        }
                        return file_result.include_code;
                    })
                )
            ).filter(Boolean);
            // add the wyvr scripts
            for (const key of Object.keys(has)) {
                scripts.push(insert_script_import(join(resouce_dir, `${key}.js`), `wyvr_${key}`));
            }
            scripts.push(`
                const wyvr_identifier = ${stringify(identifier)};
            `);

            if (Env.is_dev()) {
                scripts.push(read(join(resouce_dir, 'devtools.js')));
                scripts.push(`
                console.log('wyvr: identifier', wyvr_identifier?.identifier, wyvr_identifier);
                `);
            }
            // trigger ready event
            scripts.push(`if(!window.ready) {
                window.ready = true;
                window.setTimeout(()=> {
                    window.trigger('ready');
                }, 500);
            }`);

            gen_identifier_file = Cwd.get(FOLDER_GEN_JS, `${identifier.identifier}.js`);
        } catch (e) {
            Logger.error(get_error_message(e, identifier.identifier, 'script create'));
            Logger.debug(e);
            continue;
        }
        let has_content = false;
        try {
            let build_content;
            if (filled_array(content)) {
                has_content = true;
                build_content = scripts.join('\n') + content.join('\n');
            } else {
                if (Env.is_dev()) {
                    build_content = scripts.join('\n');
                } else {
                    // minimal set of js
                    build_content = base_scripts.join('\n');
                }
            }

            if (filled_string(build_content)) {
                result = await build(build_content, gen_identifier_file);
            }
        } catch (e) {
            Logger.error(get_error_message(e, identifier.identifier, 'script build'));
            continue;
        }
        if (!result?.code && has_content) {
            Logger.error('empty code in', identifier.identifier);
            continue;
        }
        try {
            const code = result.code.replace('%sourcemap%', `# sourceMappingURL=/js/${identifier.identifier}.js.map`);

            write(gen_identifier_file, code);

            const rel_path = `/${join(FOLDER_JS, `${identifier.identifier}.js`)}`;
            write(ReleasePath.get(rel_path), code);
            optimize_js(code, rel_path);

            // source map
            write(`${gen_identifier_file}.map`, result.sourcemap);
            write(join(ReleasePath.get(), FOLDER_JS, `${identifier.identifier}.js.map`), result.sourcemap);
            Logger.debug('identifier', identifier, dependency_list);
        } catch (e) {
            Logger.error(get_error_message(e, identifier.identifier, 'script write'));
        }
    }
}
