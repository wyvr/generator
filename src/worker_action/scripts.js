import { join } from 'path';
import { FOLDER_GEN, FOLDER_GEN_CLIENT, FOLDER_GEN_JS } from '../constants/folder.js';
import { WyvrFileLoading } from '../struc/wyvr_file.js';
import { build } from '../utils/build.js';
import { Config } from '../utils/config.js';
import { get_hydrate_dependencies } from '../utils/dependency.js';
import { exists, read, to_extension, write } from '../utils/file.js';
import { stringify } from '../utils/json.js';
import { Logger } from '../utils/logger.js';
import { to_dirname } from '../utils/to.js';
import { filled_array } from '../utils/validate.js';
import { Cwd } from '../vars/cwd.js';

const __dirname = to_dirname(import.meta.url);
const lib_dir = join(__dirname, '..');
const resouce_dir = join(lib_dir, 'resource');

export async function scripts(identifiers) {
    if (!filled_array(identifiers)) {
        return;
    }

    const file_config = Config.get('dependencies.config');
    for (const identifier of identifiers) {
        const tree = Config.get('dependencies.top');
        const dependencies = [];
        ['doc', 'layout', 'page'].forEach((type) => {
            dependencies.push(
                ...get_hydrate_dependencies(tree, file_config, `${type}/${to_extension(identifier[type], 'svelte')}`)
            );
        });
        const has = { instant: false };
        // build file content
        const content = await Promise.all(
            dependencies.map(async (file) => {
                const target = `const ${file.name}_target = document.querySelectorAll('[data-hydrate="${file.name}"]');`;
                const import_path = to_extension(join(Cwd.get(), FOLDER_GEN_CLIENT, file.path), 'js');
                const instant_code = `
                import ${file.name} from '${import_path}';
                ${target}
                wyvr_hydrate_instant(${file.name}_target, ${file.name});`;
                // loading=instant
                if (file.config.loading == WyvrFileLoading.instant) {
                    has.instant = true;
                    return instant_code;
                }
                // build seperate file for the component
                if (
                    [WyvrFileLoading.lazy, WyvrFileLoading.idle, WyvrFileLoading.media, WyvrFileLoading.none].indexOf(
                        file.config.loading
                    ) > -1
                ) {
                    const lazy_file_path = `/js/${to_extension(file.path, 'js')}`;
                    const real_lazy_file_path = join(Cwd.get(), FOLDER_GEN, lazy_file_path);
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
                        write(real_lazy_file_path, result);
                    }
                    // set marker for the needed hydrate methods
                    has[file.config.loading] = true;
                    // loading none requires a trigger property
                    const trigger = file.config.loading == WyvrFileLoading.none ? `, '${file.config.trigger}'` : '';
                    return `${target}
                wyvr_hydrate_${file.config.loading}('${lazy_file_path}', ${file.name}_target, '${file.name}', '${file.name}'${trigger});`;
                }
                return '';
            })
        );
        const scripts = [];
        Object.keys(has).forEach((key) => {
            const script_path = join(resouce_dir, `hydrate_${key}.js`);
            scripts.push(read(script_path));
        });
        scripts.push(read(join(resouce_dir, 'props.js')));
        scripts.push(read(join(resouce_dir, 'portal.js')));
        scripts.push(read(join(resouce_dir, 'i18n.js')).replace(/@lib/g, lib_dir));

        /**/
        const identifier_file = join(Cwd.get(), FOLDER_GEN_JS, `${identifier.identifier}.js`);

        write(
            identifier_file,
            await build(
                `const identifier = ${stringify(identifier)};
                console.log('identifier', identifier);
                const dependencies = ${stringify(dependencies)};
                console.log('dependencies', dependencies);
                ${scripts.join('\n')}
                ${content.join('\n')}`,
                identifier_file
            )
        );
        Logger.info('identifier', identifier, dependencies);
    }
}
