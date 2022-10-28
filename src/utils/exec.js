import { statSync } from 'fs';
import { FOLDER_GEN_EXEC, FOLDER_GEN_SRC } from '../constants/folder.js';
import { Cwd } from '../vars/cwd.js';
import { compile_server_svelte } from './compile.js';
import { render_server_compiled_svelte } from './compile_svelte.js';
import { set_config_cache } from './config_cache.js';
import { get_error_message } from './error.js';
import { collect_files, exists, read, write } from './file.js';
import { generate_page_code } from './generate.js';
import { Logger } from './logger.js';
import { to_relative_path } from './to.js';
import {
    filled_array,
    filled_object,
    filled_string,
    in_array,
    is_func,
    is_null,
    is_string,
    match_interface,
} from './validate.js';
import { process_page_data } from './../worker_action/process_page_data.js';
import { inject } from './build.js';
import { replace_imports } from './transform.js';

export async function build_cache() {
    const files = collect_files(Cwd.get(FOLDER_GEN_EXEC));
    const cache = {};
    const executed_result = await Promise.all(
        files.map(async (file) => {
            Logger.debug(file);
            // ignore files with a starting underscore
            const last = file.split('/').pop();
            if (last.match(/^_/)) {
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
    if (!exists(file)) {
        return undefined;
    }
    let result;
    const cache_breaker = `?${Date.now()}`;
    const uniq_path = `${file}?${cache_breaker}`;
    write(file, replace_imports(read(file), file, FOLDER_GEN_SRC, 'exec', cache_breaker));
    try {
        result = await import(uniq_path);
        if (result && result.default) {
            result = result.default;
        }
    } catch (e) {
        Logger.error(get_error_message(e, file, 'exec'));
    }
    return result;
}

export function get_exec(url, method, exec_cache) {
    if (!filled_string(url) || !filled_object(exec_cache)) {
        return undefined;
    }
    const normalized_method = is_string(method) ? method.trim().toLowerCase() : '';
    const exec_cache_key = Object.keys(exec_cache).find((key) => {
        return url.match(new RegExp(key)) && in_array(exec_cache[key].methods, normalized_method);
    });
    if (!exec_cache_key) {
        return undefined;
    }
    return exec_cache[exec_cache_key];
}

export async function run_exec(request, response, uid, exec) {
    if (!match_interface(request, { url: true })) {
        return undefined;
    }
    const params_match = request.url.match(exec.match);
    if (!params_match) {
        Logger.error(uid, "can't extract params from url", request.url, exec);
        return undefined;
    }
    // get parameters from url
    const params = {};
    exec.params.forEach((param, idx) => {
        params[param] = params_match[idx + 1].replace(/\/$/, '').trim();
    });
    params.isExec = !request.isNotExec;
    // get the exec result
    const code = await load_exec(exec.path);

    if (is_null(code)) {
        return undefined;
    }

    const error_message = (key) => `error in ${key} function`;

    // execute load function when set to get data
    let data = {};
    const exec_object = {request, response, params};
    if (is_func(code.onExec)) {
        try {
            data = await code.onExec(exec_object);
        } catch (e) {
            Logger.error('[exec]', error_message('onExec'), get_error_message(e, exec.path, 'exec'));
        }
    }
    // when onExec does not return a correct object force one
    if (is_null(data)) {
        Logger.warning('[exec]', `onExec in ${exec.path} should return a object`);
        data = {};
    }

    exec_object.data = data;

    // replace function properties
    await Promise.all(
        Object.keys(code).map(async (key) => {
            if (key == 'onExec') {
                return undefined;
            }
            if (is_func(code[key])) {
                try {
                    data[key] = await code[key](exec_object);
                } catch (e) {
                    Logger.error('[exec]', error_message(key), get_error_message(e, exec.path, 'exec'));
                }
                return null;
            }
            data[key] = JSON.parse(JSON.stringify(code[key]));
            return undefined;
        })
    );

    data.url = request.url;
    const page_data = process_page_data(data, exec.mtime);
    page_data._wyvr.is_exec = true;
    page_data._wyvr.exec_pattern = exec.url;

    let content = generate_page_code(page_data);

    const exec_result = await compile_server_svelte(content, exec.path);

    const rendered_result = await render_server_compiled_svelte(exec_result, page_data, exec.path);

    if (!rendered_result) {
        return undefined;
    }

    if (rendered_result) {
        rendered_result.data = page_data;
    }

    const injected_result = await inject(rendered_result, data, exec.path, (shortcode_emit) => {
        // send_action(WorkerAction.emit, shortcode_emit);
        console.log('@TODO process shortcodes in exec', shortcode_emit);
    });

    rendered_result.result.html = injected_result.content;

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
        .join('\\/')}/?$`;
    let methods = ['get', 'head', 'post', 'put', 'delete', 'connect', 'options', 'trace', 'patch'];
    if (filled_array(result?._wyvr?.exec_methods)) {
        methods = result?._wyvr?.exec_methods.filter((method) => in_array(methods, method));
    }
    return {
        url: result.url,
        path,
        rel_path: to_relative_path(path),
        params,
        match,
        mtime: stats.mtimeMs,
        methods,
    };
}
