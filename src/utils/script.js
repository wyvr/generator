import { join } from 'node:path';
import { FOLDER_GEN, FOLDER_GEN_CLIENT, FOLDER_JS } from '../constants/folder.js';
import { WyvrFileLoading, WyvrFileRender } from '../struc/wyvr_file.js';
import { Cwd } from '../vars/cwd.js';
import { Env } from '../vars/env.js';
import { exists, to_extension, write } from './file.js';
import { get_file_time_hash } from './hash.js';
import { to_dirname, to_relative_path } from './to.js';
import { filled_string, in_array, match_interface } from './validate.js';
import { build } from './build.js';
import { WyvrFile } from '../model/wyvr_file.js';
import { ReleasePath } from '../vars/release_path.js';
import { optimize_js } from './optimize/js.js';
import { Dependency } from '../model/dependency.js';
import { WyvrFileClassification } from '../vars/wyvr_file_classification.js';

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

export function get_request_code(name, loading, import_path, target, trigger) {
    if (!filled_string(name) || !filled_string(import_path)) {
        return '';
    }
    if (!filled_string(target)) {
        return `console.error('no target found for ${name} from ${import_path}');`;
    }
    const cache_breaker = Env.is_dev() ? `?${get_file_time_hash(import_path)}` : '';
    const load_path = join('$request', to_relative_path(import_path).replace(/\.svelte$/, ''));
    const trigger_code = loading !== WyvrFileLoading.instant && trigger ? `, '${trigger}'` : '';
    return [`import ${name} from '${import_path}${cache_breaker}';`, target, `wyvr_request_${loading}(${name}_target, '${name}', '/${load_path}/'${trigger_code});`].join('');
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
    if (!WyvrFileClassification.is_valid_loading_value(file.config.loading)) {
        return undefined;
    }
    const target = get_target(file.name);
    const import_path = Cwd.get(FOLDER_GEN_CLIENT, to_relative_path(file.path));
    // code to instant execute the dependency
    const instant_code =
        file.config.render === WyvrFileRender.request
            ? get_request_code(file.name, file.config.loading, import_path, target, file.config.trigger)
            : get_instant_code(file.name, import_path, target);
    const script_function_name = `${file.config.render}_${file.config.loading}`;
    result.has[script_function_name] = true;
    if (WyvrFileClassification.is_server_request(file.config.render) || (file.config.render === WyvrFileRender.hydrate && file.config.loading === WyvrFileLoading.instant)) {
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
    // loading none requires a trigger property, but everything except instant can be triggered
    const trigger = file.config.loading !== WyvrFileLoading.instant && file.config.trigger ? `, '${file.config.trigger}'` : '';
    const cache_breaker = Env.is_dev() ? `?ts=${Date.now()}` : '';
    result.include_code = `${target}
                wyvr_${file.config.render}_${file.config.loading}('${lazy_file_path}${cache_breaker}', ${file.name}_target, '${file.name}', '${file.name}'${trigger});`;
    return result;
}

let dep_db;
export async function build_hydrate_file_from_url(url) {
    const resouce_dir = join(to_dirname(import.meta.url), '..', 'resource');

    const [clean_url] = url
        .replace(/#.*$/, '')
        .replace(/\/[^/]+\//, '')
        .split('?');
    const svelte_file = to_extension(clean_url, 'svelte');
    if (!dep_db) {
        dep_db = new Dependency();
    }
    const entry = dep_db.get_file(svelte_file);
    if (entry?.config && entry?.standalone === WyvrFileRender.hydrate) {
        const file = WyvrFile(svelte_file);
        file.config = entry.config;
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
