import { statSync } from 'fs';
import { FOLDER_GEN_ROUTES, FOLDER_GEN_SRC, FOLDER_ROUTES } from '../constants/folder.js';
import { Cwd } from '../vars/cwd.js';
import { compile_server_svelte } from './compile.js';
import { render_server_compiled_svelte } from './compile_svelte.js';
import { set_config_cache } from './config_cache.js';
import { get_error_message } from './error.js';
import { collect_files, exists, read, write } from './file.js';
import { generate_page_code } from './generate.js';
import { Logger } from './logger.js';
import { to_relative_path_of_gen } from './to.js';
import { filled_array, filled_string, in_array, is_func, is_null, is_string, match_interface } from './validate.js';
import { process_page_data } from '../action_worker/process_page_data.js';
import { inject } from './build.js';
import { replace_imports } from './transform.js';
import { register_i18n } from './global.js';
import { get_language } from './i18n.js';
import { append_cache_breaker } from './cache_breaker.js';
import { Plugin } from './plugin.js';
import { is_path_valid } from './reserved_words.js';
import { Env } from '../vars/env.js';

export async function build_cache() {
    const files = collect_files(Cwd.get(FOLDER_GEN_ROUTES));
    const cache = [];
    const executed_result = await Promise.all(
        files.map(async (file) => {
            Logger.debug(file);
            // ignore files with a starting underscore
            const last = file.split('/').pop();
            if (last.match(/^_/)) {
                return undefined;
            }
            const result = await load_route(file);
            const config = await extract_route_config(result, file);
            if (config) {
                cache.push(config);
            }

            return file;
        })
    );
    set_config_cache(
        'route.cache',
        cache.sort((a, b) => b.weight - a.weight)
    );
    return executed_result.filter((x) => x);
}

export async function load_route(file) {
    if (!exists(file)) {
        return undefined;
    }
    let result;
    const uniq_path = append_cache_breaker(file);
    write(file, replace_imports(read(file), file, FOLDER_GEN_SRC, FOLDER_ROUTES));
    try {
        result = await import(uniq_path);
        if (result && result.default) {
            result = result.default;
        }
        /* c8 ignore start */
        if (!is_path_valid(result.url)) {
            return undefined;
        }
        /* c8 ignore end */
    } catch (e) {
        Logger.error(get_error_message(e, file, 'route'));
    }
    return result;
}

export function get_route(url, method, route_cache) {
    if (!filled_string(url) || !filled_array(route_cache)) {
        return undefined;
    }

    // remove the get parameter from the url
    const clean_url = url.split('?')[0];
    const normalized_method = is_string(method) ? method.trim().toLowerCase() : '';
    const found_cache_item = route_cache.find((item) => {
        return clean_url.match(new RegExp(item.match)) && in_array(item.methods, normalized_method);
    });
    return found_cache_item;
}

export async function run_route(request, response, uid, route) {
    if (!match_interface(request, { url: true })) {
        return undefined;
    }

    // remove the get parameter from the url
    const split = request.url.split('?');
    const clean_url = split[0];
    const query = {};
    if (split[1]) {
        split[1].split('&').forEach((entry) => {
            const parts = entry.split('=');
            parts[0] = decodeURIComponent(parts[0]).replace(/\+/g, ' ');
            if (parts.length == 1) {
                query[parts[0]] = true;
                return;
            }
            query[parts[0]] = decodeURIComponent(parts[1]).replace(/\+/g, ' ');
        });
    }
    const headers = request.headers || {};
    const body = request.body || {};
    const files = request.files || {};

    const params_match = clean_url.match(route.match);
    if (!params_match) {
        Logger.error(uid, "can't extract params from url", clean_url, route);
        return undefined;
    }
    // get parameters from url
    const params = {};
    route.params.forEach((param, idx) => {
        params[param] = params_match[idx + 1].replace(/\/$/, '').trim();
    });
    params.isExec = !request.isNotExec;
    // get the route result
    const code = await load_route(route.path);

    if (is_null(code)) {
        return undefined;
    }

    const error_message = (key) => `error in ${key} function`;

    // execute load function when set to get data
    let data = {
        url: clean_url,
    };
    let status = 200;
    let header = {};
    let customHead = false;
    let route_context = {
        request,
        response,
        params,
        headers,
        query,
        body,
        files,
        data,
        isProd: Env.is_prod(),
        returnJSON: (json, status = 200, headers = {}) => {
            const response_header = Object.assign({}, headers);
            response_header['Content-Type'] = 'application/json';
            response.writeHead(status, response_header);
            response.end(JSON.stringify(json));
        },
        setStatus: (statusCode = 200) => {
            status = statusCode;
            customHead = true;
        },
        setHeader: (key, value) => {
            header[key] = value;
            customHead = true;
        },
    };

    const construct_route_context = await Plugin.process('construct_route_context', route_context);
    const { result } = await construct_route_context((route_object) => {
        return route_object;
    });
    route_context = result;

    if (is_func(code.onExec)) {
        /* c8 ignore next */
        const language = data?._wyvr?.language || 'en';
        register_i18n(get_language(language), route.path);
        try {
            data = await code.onExec(route_context);
            if (response.writableEnded) {
                return undefined;
            }
        } catch (e) {
            Logger.error('[route]', error_message('onExec'), get_error_message(e, route.path, 'route'));
        }
    }
    // when onExec does not return a correct object force one
    if (!data) {
        Logger.warning('[route]', `onExec in ${route.path} should return a object`);
        data = route_context.data;
    }

    route_context.returnJSON = () => {
        Logger.warning('[route]', 'returnJSON can only be used in onExec');
    };
    route_context.data = data;

    /* c8 ignore next */
    const language = data?._wyvr?.language || 'en';
    register_i18n(get_language(language), route.path);

    // replace function properties
    await Promise.all(
        Object.keys(code).map(async (key) => {
            if (in_array(['onExec', 'getCollection'], key)) {
                return undefined;
            }
            if (is_func(code[key])) {
                try {
                    data[key] = await code[key](route_context);
                } catch (e) {
                    Logger.error('[route]', error_message(key), get_error_message(e, route.path, 'route'));
                }
                return null;
            }
            data[key] = JSON.parse(JSON.stringify(code[key]));
            return undefined;
        })
    );
    // when customHead is set execute it
    if (customHead) {
        response.writeHead(status, header);
    }

    data.url = clean_url;
    const page_data = await process_page_data(data, route.mtime);
    page_data._wyvr.is_exec = true;
    page_data._wyvr.route_pattern = route.url;

    let content = generate_page_code(page_data);

    const route_result = await compile_server_svelte(content, route.path);

    const rendered_result = await render_server_compiled_svelte(route_result, page_data, route.path);

    /* c8 ignore start */
    // safeguard
    if (!rendered_result) {
        return undefined;
    }
    /* c8 ignore end */

    if (rendered_result) {
        rendered_result.data = page_data;
    }
    const identifier = rendered_result.data?._wyvr?.identifier || 'default';
    const injected_result = await inject(rendered_result, page_data, route.path, identifier, (shortcode_emit) => {
        Logger.debug('shortcode', shortcode_emit);
        if (shortcode_emit) {
            if (!rendered_result.shortcode) {
                rendered_result.shortcode = {};
            }
            delete shortcode_emit.type;
            rendered_result.shortcode[shortcode_emit.identifier] = shortcode_emit;
        }
    });

    rendered_result.result.html = injected_result.content;

    return rendered_result;
}

export async function extract_route_config(result, path) {
    if (!match_interface(result, { url: true }) || !exists(path)) {
        return undefined;
    }
    const stats = statSync(path);
    const params = [];
    const url_parts = result.url.split('/');
    const match = `^${url_parts
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
    // execute _wyvr to get insights into the executable
    if (typeof result?._wyvr == 'function') {
        result._wyvr = await result._wyvr({});
    }
    if (filled_array(result?._wyvr?.methods)) {
        methods = result?._wyvr?.methods.filter((method) => in_array(methods, method));
    }

    // get specificity of the url, to detect the order of match checking
    const weight = url_parts.reduce((sum, part) => {
        let weight = 1000; // default weight of exact matches
        if (part.match(/^\[.*\]$/)) {
            weight = 100;
        }
        if (part == '.*' || part == '*' || !part.trim()) {
            weight = 10;
        }

        return sum + weight;
    }, result.url.length);

    return {
        url: result.url,
        path,
        rel_path: to_relative_path_of_gen(path),
        params,
        match,
        mtime: stats.mtimeMs,
        methods,
        weight,
    };
}
