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
export function get_target_code(name) {
    if (!filled_string(name)) {
        return '';
    }
    return `const ${name}_target = document.querySelectorAll('[data-hydrate="${name}"]');`;
}

function get_import(name, import_client_script_path) {
    const ts = get_file_time_hash(import_client_script_path);
    const cache_breaker = Env.is_dev() && ts ? `?${ts}` : '';
    return `import ${name} from '${import_client_script_path}${cache_breaker}';`;
}

export async function build_file(file, resource_dir) {
    const script_function_name = `${file.config.render}_${file.config.loading}`;
    const result = {
        has: { [script_function_name]: true },
        include_code: '' // used to insert code in the main script file to execute this file
    };

    if (!match_interface(file, { name: true, path: true, config: true }) || !filled_string(resource_dir) || !WyvrFileClassification.is_valid_loading_value(file?.config?.loading)) {
        return undefined;
    }
    // contains the selector for the elements
    const target_code = get_target_code(file.name);
    const client_script_path = Cwd.get(FOLDER_GEN_CLIENT, to_relative_path(file.path));
    const request_url = in_array([WyvrFileRender.hydrequest, WyvrFileRender.request], file.config.render)
        ? `/${file.rel_path.replace(/\.svelte$/, '').replace(/\$src/, '$request')}/`
        : undefined;

    result.path = `/${FOLDER_JS}/${to_extension(file.path, 'js')}`;
    result.real_path = Cwd.get(FOLDER_GEN, result.path);
    const import_path = Cwd.get(FOLDER_GEN_CLIENT, to_relative_path(file.path));
    const cache_breaker = Env.is_dev() ? `?ts=${Date.now()}` : '';

    const instant_code = get_class_code(file.name, client_script_path);
    const trigger = file.config.trigger ? `'${file.config.trigger}'` : 'undefined';

    switch (file.config.render) {
        case WyvrFileRender.hydrate: {
            // instant ends here, it is directly executed from the main script file
            if (file.config.loading === WyvrFileLoading.instant) {
                result.include_code = get_instant_code(file.name, client_script_path, target_code);
                return result;
            }
            result.include_code = [target_code, `wyvr_hydrate_${file.config.loading}('${result.path}${cache_breaker}', ${file.name}_target, '${file.name}', ${trigger});`].join('');

            break;
        }
        case WyvrFileRender.hydrequest: {
            if (file.config.loading === WyvrFileLoading.instant) {
                result.include_code = get_hydrequest_instant_code(file.name, import_path, target_code, request_url, trigger);
                return result;
            }
            result.include_code = get_hydrequest_code(file.name, file.config.loading, `${result.path}${cache_breaker}`, request_url, target_code, trigger);
            break;
        }
        case WyvrFileRender.request: {
            result.include_code = get_request_code(file.name, file.config.loading, request_url, target_code, trigger);
            // request does not have lazy files
            return result;
        }
    }

    // build the lazy file from the instant_code
    if (instant_code && (!exists(result.real_path) || Env.is_dev() || !exists(ReleasePath.get(result.path)))) {
        const content = [insert_script_import(join(resource_dir, 'class.js'), 'wyvr_class'), instant_code].join('\n');

        const build_result = await build(content, result.real_path);

        // @NOTE sourcemaps are ignored for now
        //const code = build_result.code.replace('%sourcemap%', `# sourceMappingURL=${to_extension(file.path, 'js')}.map`);
        //result.sourcemap = build_result.sourcemap;

        result.code = build_result.code;
    }
    return result;
}

let dep_db;
export async function build_file_from_url(url) {
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
        const file_result = await build_file(file, resouce_dir);
        write_file(file_result);
        return file_result.code;
    }
    return undefined;
}

export function write_file(file_result) {
    if (!file_result?.code) {
        return;
    }
    if (file_result.path) {
        write(ReleasePath.get(file_result.path), file_result.code);
        optimize_js(file_result.code, file_result.path);
    }
    // js in gen folder
    if (file_result.real_path) {
        write(file_result.real_path, file_result.code);
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

/**
 * Get the js code for instant execution
 * @param {string} name
 * @param {string} import_client_script_path
 * @param {string} target_code
 * @returns {string}
 */
export function get_instant_code(name, import_client_script_path, target_code) {
    if (!filled_string(name) || !filled_string(import_client_script_path) || !filled_string(target_code)) {
        return '';
    }
    return [get_import(name, import_client_script_path), target_code, `wyvr_hydrate_instant(${name}_target, ${name}, '${name}');`].join('');
}
export function get_class_code(name, import_client_script_path) {
    if (!filled_string(name) || !filled_string(import_client_script_path)) {
        return '';
    }
    return [get_import(name, import_client_script_path), `wyvr_class(${name}, '${name}');`].join('');
}

export function get_request_code(name, loading, request_url, target_code, trigger) {
    if (!filled_string(name) || !filled_string(request_url) || !filled_string(target_code)) {
        return '';
    }

    return [target_code, `wyvr_request_${loading}(${name}_target, '${name}', '${request_url}', ${trigger});`].join('');
}

export function get_hydrequest_instant_code(name, import_client_script_path, target_code, request_url, trigger) {
    if (!filled_string(name) || !filled_string(import_client_script_path) || !filled_string(request_url) || !filled_string(target_code)) {
        return '';
    }
    return [get_import(name, import_client_script_path), target_code, `wyvr_hydrequest_instant(${name}_target, ${name}, '${name}', '${request_url}', ${trigger});`].join('');
}

export function get_hydrequest_code(name, loading, path, request_url, target_code, trigger) {
    if (!filled_string(name) || !filled_string(loading) || !filled_string(path) || !filled_string(request_url) || !filled_string(target_code)) {
        return '';
    }
    return [target_code, `wyvr_hydrequest_${loading}('${path}', ${name}_target, '${name}', '${request_url}', ${trigger});`].join('');
}
