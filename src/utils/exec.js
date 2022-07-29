import { statSync } from 'fs';
import { FOLDER_GEN_EXEC } from '../constants/folder.js';
import { Cwd } from '../vars/cwd.js';
import { compile_server_svelte } from './compile.js';
import { render_server_compiled_svelte } from './compile_svelte.js';
import { get_config_cache, set_config_cache } from './config_cache.js';
import { get_error_message } from './error.js';
import { collect_files, exists } from './file.js';
import { generate_page_code } from './generate.js';
import { Logger } from './logger.js';
import { to_relative_path } from './to.js';
import { filled_string, is_func, is_null, match_interface } from './validate.js';
import { process_page_data } from './../worker_action/process_page_data.js';

export async function build_cache() {
    const files = collect_files(Cwd.get(FOLDER_GEN_EXEC));
    const cache = {};
    const executed_result = await Promise.all(
        files.map(async (file) => {
            Logger.info(file);
            // ignore files with a starting underscore
            if (file.split('/').pop().match(/^_/)) {
                return undefined;
            }
            const result = await load_exec(file);
            const config = extract_exec_config(result, file);
            if (config) {
                cache[config.match] = config;
            }

            return file;
        })
    );
    set_config_cache('exec.cache', cache);
    return executed_result.filter((x) => x);
}

export async function load_exec(file) {
    let result;
    try {
        result = await import(file + '?' + Date.now());
        if (result && result.default) {
            result = result.default;
        }
    } catch (e) {
        Logger.error(get_error_message(e, file, 'exec'));
    }
    return result;
}

let exec_cache;
export function get_exec(url) {
    if (!filled_string(url)) {
        return undefined;
    }
    if (!exec_cache) {
        exec_cache = get_config_cache('exec.cache');
    }
    const found_match = Object.keys(exec_cache).find((key) => {
        return url.match(new RegExp(key));
    });
    if (!found_match) {
        return undefined;
    }
    return exec_cache[found_match];
}

export async function run_exec(request, response, uid, exec) {
    const params_match = request.url.match(exec.match);
    if (!params_match) {
        Logger.error(uid, "can't extract params from url", request.url, exec);
        return undefined;
    }
    // get parameters from url
    const params = {};
    exec.params.forEach((param, idx) => {
        params[param] = params_match[idx + 1];
    });
    // get the exec result
    const code = await load_exec(exec.path);

    if (is_null(code)) {
        return undefined;
    }

    // execute load function when set to get data
    let data = {};
    if (is_func(code.onExec)) {
        try {
            data = await code.onExec(request, response, params);
        } catch (e) {
            Logger.error('[exec]', 'onExec', get_error_message(e, exec.path, 'exec'));
        }
    }

    // replace function properties
    await Promise.all(
        Object.keys(code).map(async (key) => {
            if (key == 'onExec') {
                return undefined;
            }
            if (typeof code[key] == 'function') {
                try {
                    data[key] = await code[key](request, response, params, data);
                } catch (e) {
                    Logger.error('[exec]', key, get_error_message(e, exec.path, key));
                }
                return null;
            }
            data[key] = JSON.parse(JSON.stringify(code[key]));
            return undefined;
        })
    );

    const page_data = process_page_data(data, exec.mtime);

    let content = generate_page_code(page_data);

    const exec_result = await compile_server_svelte(content, exec.path);

    const rendered_result = await render_server_compiled_svelte(exec_result, page_data, exec.path);

    

    if (rendered_result) {
        rendered_result.data = page_data;
    }

    return rendered_result;
}

export function extract_exec_config(result, path) {
    if (!match_interface(result, { url: true }) || !exists(path)) {
        return undefined;
    }
    const stats = statSync(path);
    const params = [];
    const match = `^${result.url
        .split('/')
        .map((item) => {
            const result = item.match(/^\[([^\]]*)\]$/);
            if (result) {
                params.push(result[1]);
                return '([^\\]]*)';
            }
            return item;
        })
        .join('\\/')}$`;
    return { url: result.url, path, rel_path: to_relative_path(path), params, match, mtime: stats.mtimeMs };
}
