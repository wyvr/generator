import { join } from 'path';
import { FOLDER_GEN, FOLDER_GEN_CLIENT, FOLDER_GEN_JS } from '../constants/folder.js';
import { WyvrFileLoading } from '../struc/wyvr_file.js';
import { build } from '../utils/build.js';
import { get_config_cache } from '../utils/config_cache.js';
import { get_hydrate_dependencies } from '../utils/dependency.js';
import { get_error_message } from '../utils/error.js';
import { exists, read, to_extension, write } from '../utils/file.js';
import { get_file_time_hash } from '../utils/hash.js';
import { stringify } from '../utils/json.js';
import { Logger } from '../utils/logger.js';
import { write_identifier_structure } from '../utils/structure.js';
import { to_dirname, to_relative_path } from '../utils/to.js';
import { filled_array, in_array, is_null } from '../utils/validate.js';
import { Cwd } from '../vars/cwd.js';
import { Env } from '../vars/env.js';

const __dirname = to_dirname(import.meta.url);
const lib_dir = join(__dirname, '..');
const resouce_dir = join(lib_dir, 'resource');

export async function scripts(identifiers) {
    if (!filled_array(identifiers)) {
        return;
    }
    const file_config = get_config_cache('dependencies.config');
    const tree = get_config_cache('dependencies.top');
    let package_tree;
    if (Env.is_dev()) {
        package_tree = get_config_cache('package_tree');
    }
    for (const identifier of identifiers) {
        try {
            if(is_null(identifier)) {
                Logger.warning('empty identifier found');
                continue;
            }
            const is_shortcode = !!identifier.imports;
            let dependencies = [];
            // shortcode dependencies
            if (is_shortcode) {
                dependencies = [].concat(
                    ...Object.keys(identifier.imports).map((key) => {
                        return get_hydrate_dependencies(tree, file_config, to_relative_path(identifier.imports[key]));
                    })
                );
            } else {
                dependencies = [].concat(
                    ...['doc', 'layout', 'page'].map((type) => {
                        return get_hydrate_dependencies(
                            tree,
                            file_config,
                            `${type}/${to_extension(identifier[type], 'svelte')}`
                        );
                    })
                );
            }
            if (Env.is_dev()) {
                write_identifier_structure(identifier, tree, file_config, package_tree);
            }

            const has = { instant: false };
            // build file content
            const content = (
                await Promise.all(
                    dependencies.map(async (file) => {
                        const target = `const ${file.name}_target = document.querySelectorAll('[data-hydrate="${file.name}"]');`;
                        const import_path = Cwd.get(FOLDER_GEN_CLIENT, file.path);
                        const cache_breaker = Env.is_dev() ? `?${get_file_time_hash(import_path)}` : '';

                        const instant_code = `
                import ${file.name} from '${import_path}${cache_breaker}';
                ${target}
                wyvr_hydrate_instant(${file.name}_target, ${file.name});`;
                        // loading=instant
                        if (file.config.loading == WyvrFileLoading.instant) {
                            has.instant = true;
                            return instant_code;
                        }
                        // build seperate file for the component
                        if (
                            in_array(
                                [
                                    WyvrFileLoading.lazy,
                                    WyvrFileLoading.idle,
                                    WyvrFileLoading.media,
                                    WyvrFileLoading.none,
                                ],
                                file.config.loading
                            )
                        ) {
                            const lazy_file_path = `/js/${to_extension(file.path, 'js')}`;
                            const real_lazy_file_path = Cwd.get(FOLDER_GEN, lazy_file_path);
                            // write the lazy file from the component
                            if (!exists(real_lazy_file_path)) {
                                // ${script_partials.hydrate}
                                // ${script_partials.props}
                                // ${script_partials.portal}
                                const result = await build(
                                    `
                            ${read(join(resouce_dir, 'hydrate_instant.js'))}
                            ${read(join(resouce_dir, 'props.js'))}
                            ${read(join(resouce_dir, 'portal.js'))}
                            ${instant_code}
                            `,
                                    real_lazy_file_path
                                );
                                write(
                                    real_lazy_file_path,
                                    result.code.replace(
                                        '%sourcemap%',
                                        `# sourceMappingURL=${to_extension(file.path, 'js')}.map`
                                    )
                                );
                                write(real_lazy_file_path + '.map', result.sourcemap);
                            }
                            // set marker for the needed hydrate methods
                            has[file.config.loading] = true;
                            // loading none requires a trigger property
                            const trigger =
                                file.config.loading == WyvrFileLoading.none ? `, '${file.config.trigger}'` : '';
                            return `${target}
                wyvr_hydrate_${file.config.loading}('${lazy_file_path}', ${file.name}_target, '${file.name}', '${file.name}'${trigger});`;
                        }
                        return '';
                    })
                )
            ).filter((x) => x);
            const scripts = [];
            Object.keys(has).forEach((key) => {
                const script_path = join(resouce_dir, `hydrate_${key}.js`);
                scripts.push(read(script_path));
            });
            scripts.push(read(join(resouce_dir, 'events.js')));
            scripts.push(read(join(resouce_dir, 'props.js')));
            scripts.push(read(join(resouce_dir, 'portal.js')));
            scripts.push(read(join(resouce_dir, 'i18n.js')).replace(/\[lib\]/g, lib_dir));
            if (Env.is_dev()) {
                scripts.push(read(join(resouce_dir, 'devtools.js')));
            }

            /**/
            const identifier_file = Cwd.get(FOLDER_GEN_JS, `${identifier.identifier}.js`);

            let result = { code: '', sourcemap: '' };
            if (filled_array(content)) {
                result = await build(
                    `const identifier = ${stringify(identifier)};
                console.log('identifier', identifier);
                const dependencies = ${stringify(dependencies)};
                console.log('dependencies', dependencies);
                ${scripts.join('\n')}
                ${content.join('\n')}`,
                    identifier_file
                );
            } else {
                if (Env.is_dev()) {
                    result.code = read(join(resouce_dir, 'devtools.js'));
                }
            }
            write(
                identifier_file,
                result.code.replace('%sourcemap%', `# sourceMappingURL=/js/${identifier.identifier}.js.map`)
            );
            write(identifier_file + '.map', result.sourcemap);
            Logger.debug('identifier', identifier, dependencies);
        } catch (e) {
            Logger.error(get_error_message(e, identifier.identifier, 'script'));
        }
    }
}
