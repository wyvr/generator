import { join } from 'path';
import { FOLDER_GEN_JS, FOLDER_JS } from '../constants/folder.js';
import { build } from '../utils/build.js';
import { get_config_cache } from '../utils/config_cache.js';
import { get_hydrate_dependencies } from '../utils/dependency.js';
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
import { build_hydrate_file, write_hydrate_file } from '../utils/script.js';
import { UniqId } from '../vars/uniq_id.js';

const __dirname = to_dirname(import.meta.url);
const lib_dir = join(__dirname, '..');
const resouce_dir = join(lib_dir, 'resource');

export async function scripts(identifiers) {
    if (!filled_array(identifiers)) {
        return;
    }
    const file_config = get_config_cache('dependencies.config');
    const tree = get_config_cache('dependencies.top');
    const package_tree = Env.is_dev() ? get_config_cache('package_tree') : undefined;
    const build_id = UniqId.get();
    const build_id_var = `window.build_id = '${build_id ? build_id.substr(0, 8) : '_'}';`;
    for (const identifier of identifiers) {
        if (is_null(identifier)) {
            Logger.warning('empty identifier found');
            continue;
        }
        let result = { code: '', sourcemap: '' };
        let identifier_file;
        let dependencies = [];
        let content;
        const scripts = [
            build_id_var,
            read(join(resouce_dir, 'events.js')),
            read(join(resouce_dir, 'props.js')),
            read(join(resouce_dir, 'portal.js')),
            read(join(resouce_dir, 'stack.js')),
            read(join(resouce_dir, 'i18n.js')).replace(/\[lib\]/g, lib_dir)
        ];

        try {
            const is_shortcode = !!identifier.imports;
            // shortcode dependencies
            if (is_shortcode) {
                dependencies = [].concat(
                    ...Object.keys(identifier.imports).map((key) => {
                        return get_hydrate_dependencies(tree, file_config, to_relative_path_of_gen(identifier.imports[key]));
                    })
                );
            } else {
                dependencies = [].concat(
                    ...['doc', 'layout', 'page'].map((type) => {
                        return get_hydrate_dependencies(tree, file_config, `src/${type}/${to_extension(identifier[type], 'svelte')}`);
                    })
                );
            }

            // write dev structure
            write_identifier_structure(identifier, tree, file_config, package_tree);

            const has = { instant: false };
            // build file content
            content = (
                await Promise.all(
                    dependencies.map(async (file) => {
                        const file_result = await build_hydrate_file(file, resouce_dir);
                        if (!file_result) {
                            return undefined;
                        }
                        // write files
                        write_hydrate_file(file_result);
                        // apply additive has values
                        if (file_result.has) {
                            Object.keys(file_result.has).forEach((key) => {
                                if (file_result.has[key]) {
                                    has[key] = file_result.has[key];
                                }
                            });
                        }
                        return file_result.include_code;
                    })
                )
            ).filter(Boolean);
            Object.keys(has).forEach((key) => {
                const script_path = join(resouce_dir, `hydrate_${key}.js`);
                scripts.push(read(script_path));
            });
            scripts.push(`
                const wyvr_identifier = ${stringify(identifier)};
                const wyvr_dependencies = ${stringify(dependencies)};
            `);

            if (Env.is_dev()) {
                scripts.push(read(join(resouce_dir, 'devtools.js')));
                scripts.push(`
                console.group('wyvr');
                console.log('identifier', wyvr_identifier);
                console.log('dependencies', wyvr_dependencies);
                console.groupEnd('wyvr');
                `);
            }
            // trigger ready event
            scripts.push(`if(!window.ready) {
                window.ready = true;
                window.setTimeout(()=> {
                    window.trigger('ready');
                }, 500);
            }`);

            identifier_file = Cwd.get(FOLDER_GEN_JS, `${identifier.identifier}.js`);
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
                    build_content = [
                        build_id_var,
                        read(join(resouce_dir, 'events.js')),
                        read(join(resouce_dir, 'stack.js')),
                        read(join(resouce_dir, 'i18n.js')).replace(/\[lib\]/g, lib_dir)
                    ].join('\n');
                }
            }

            if (filled_string(build_content)) {
                result = await build(build_content, identifier_file);
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

            write(identifier_file, code);
            write(join(ReleasePath.get(), FOLDER_JS, `${identifier.identifier}.js`), code);

            write(identifier_file + '.map', result.sourcemap);
            write(join(ReleasePath.get(), FOLDER_JS, `${identifier.identifier}.js.map`), result.sourcemap);
            Logger.debug('identifier', identifier, dependencies);
        } catch (e) {
            Logger.error(get_error_message(e, identifier.identifier, 'script write'));
        }
    }
}
