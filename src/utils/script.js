import { join } from 'node:path';
import { FOLDER_GEN, FOLDER_GEN_CLIENT, FOLDER_JS } from '../constants/folder.js';
import { WyvrFileLoading } from '../struc/wyvr_file.js';
import { Cwd } from '../vars/cwd.js';
import { Env } from '../vars/env.js';
import { exists, to_extension, write } from './file.js';
import { get_file_time_hash } from './hash.js';
import { to_dirname, to_relative_path } from './to.js';
import { filled_string, in_array, match_interface } from './validate.js';
import { build } from './build.js';
import { get_config_cache } from './config_cache.js';
import { WyvrFile } from '../model/wyvr_file.js';
import { ReleasePath } from '../vars/release_path.js';
import { optimize_js } from './optimize/js.js';

/**
 * Get the js selector for all elements with the given name
 * @param {string} name
 * @returns {string}
 */
export function get_target(name) {
    if (!filled_string(name)) {
        return '';
    }
    return `const ${name}_target = document.querySelectorAll('[data-hydrate="${name}"]');`;
}

/**
 * Get the js code for instant execution
 * @param {string} name
 * @param {string} import_path
 * @param {string} target
 * @returns {string}
 */
export function get_instant_code(name, import_path, target) {
    if (!filled_string(name) || !filled_string(import_path)) {
        return '';
    }
    if (!filled_string(target)) {
        return `console.error('no target found for ${name} from ${import_path}');`;
    }
    const cache_breaker = Env.is_dev() ? `?${get_file_time_hash(import_path)}` : '';
    return [`import ${name} from '${import_path}${cache_breaker}';`, target, `wyvr_hydrate_instant(${name}_target, ${name});`].join('');
}

export async function build_hydrate_file(file, resouce_dir) {
    const result = {
        has: {},
        code: undefined,
        sourcemap: undefined,
        path: undefined,
        real_path: undefined,
        include_code: ''
    };

    if (!match_interface(file, { name: true, path: true, config: true }) || !filled_string(resouce_dir)) {
        return undefined;
    }
    if (
        !in_array([WyvrFileLoading.instant, WyvrFileLoading.lazy, WyvrFileLoading.idle, WyvrFileLoading.interact, WyvrFileLoading.media, WyvrFileLoading.none], file.config.loading)
    ) {
        return undefined;
    }
    const target = get_target(file.name);
    const import_path = Cwd.get(FOLDER_GEN_CLIENT, to_relative_path(file.path));
    // code to instant execute the dependency
    const instant_code = get_instant_code(file.name, import_path, target);
    // loading=instant
    if (file.config.loading === WyvrFileLoading.instant) {
        result.has.instant = true;
        result.include_code = instant_code;
        return result;
    }
    // build seperate file for the component

    const lazy_file_path = `/${FOLDER_JS}/${to_extension(file.path, 'js')}`;
    result.path = lazy_file_path;
    const real_lazy_file_path = Cwd.get(FOLDER_GEN, lazy_file_path);
    result.real_path = real_lazy_file_path;

    // write the lazy file from the component
    if (!exists(real_lazy_file_path) || Env.is_dev() || !exists(ReleasePath.get(lazy_file_path))) {
        const content = [insert_script_import(join(resouce_dir, 'hydrate_instant.js'), 'wyvr_hydrate_instant'), instant_code].join('\n');

        const build_result = await build(content, real_lazy_file_path);

        // @NOTE sourcemaps are ignored for now
        //const code = build_result.code.replace('%sourcemap%', `# sourceMappingURL=${to_extension(file.path, 'js')}.map`);

        result.code = build_result.code;
        result.sourcemap = build_result.sourcemap;
    }
    // set marker for the needed hydrate methods
    result.has[file.config.loading] = true;
    // loading none requires a trigger property, but everything except instant can be triggered
    const trigger = file.config.loading !== WyvrFileLoading.instant && file.config.trigger ? `, '${file.config.trigger}'` : '';
    result.include_code = `${target}
                wyvr_hydrate_${file.config.loading}('${lazy_file_path}', ${file.name}_target, '${file.name}', '${file.name}'${trigger});`;
    return result;
}

export async function build_hydrate_file_from_url(url) {
    const file_config = get_config_cache('dependencies.config');
    const resouce_dir = join(to_dirname(import.meta.url), '..', 'resource');

    const [clean_url] = url
        .replace(/#.*$/, '')
        .replace(/\/[^/]+\//, '')
        .split('?');
    const svelte_file = to_extension(clean_url, 'svelte');
    const config = file_config[svelte_file];
    if (config) {
        const file = WyvrFile(svelte_file);
        file.config = config;
        const file_result = await build_hydrate_file(file, resouce_dir);
        write_hydrate_file(file_result);
        return file_result.code;
    }
    return undefined;
}

export function write_hydrate_file(file_result) {
    if (file_result.code) {
        if (file_result.path) {
            write(ReleasePath.get(file_result.path), file_result.code);
            optimize_js(file_result.code, file_result.path);
        }
        // js in gen folder
        if (file_result.real_path) {
            write(file_result.real_path, file_result.code);
        }
    }
}

export function insert_script_import(file, exports) {
    if (!filled_string(file)) {
        return '';
    }
    if (!filled_string(exports)) {
        return `import '${file}';`;
    }
    return `import { ${exports} } from '${file}';`;
}
