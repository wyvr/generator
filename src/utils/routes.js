import { statSync } from 'node:fs';
import {
    FOLDER_GEN_ROUTES,
    FOLDER_GEN_SRC,
    FOLDER_ROUTES,
} from '../constants/folder.js';
import { Cwd } from '../vars/cwd.js';
import { compile_server_svelte } from './compile.js';
import { render_server_compiled_svelte } from './compile_svelte.js';
import { get_config_cache, set_config_cache } from './config_cache.js';
import { get_error_message } from './error.js';
import { collect_files, exists, read, write } from './file.js';
import { generate_page_code } from './generate.js';
import { Logger } from './logger.js';
import { to_relative_path_of_gen } from './to.js';
import {
    filled_array,
    filled_string,
    in_array,
    is_func,
    is_null,
    is_string,
    match_interface,
} from './validate.js';
import { process_page_data } from '../action_worker/process_page_data.js';
import { inject } from './build.js';
import { replace_imports } from './transform.js';
import { register_i18n } from './global.js';
import { get_language } from './i18n.js';
import { dev_cache_breaker } from './cache_breaker.js';
import { Plugin } from './plugin.js';
import { contains_reserved_words } from './reserved_words.js';
import { Env } from '../vars/env.js';
import { stringify } from './json.js';
import { SerializableResponse } from '../model/serializable/response.js';
import { get_cookies, set_cookie } from './cookies.js';
import { uniq_values } from './uniq.js';

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
            // replace the imports only once
            const content = read(file);
            if (content) {
                write(
                    file,
                    replace_imports(
                        content,
                        file,
                        FOLDER_GEN_SRC,
                        FOLDER_ROUTES
                    )
                );
            }
            const result = await load_route(file);
            /* c8 ignore start */
            if (contains_reserved_words(result?.url)) {
                Logger.warning(
                    result?.url,
                    'contains reserved word, the route may be not executed'
                );
            }
            /* c8 ignore end */
            const config = await extract_route_config(result, file);
            if (config) {
                cache.push(config);
            }

            return file;
        })
    );
    await set_config_cache(
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
    const uniq_path = dev_cache_breaker(file);
    try {
        result = await import(uniq_path);
        if (result?.default) {
            result = result.default;
        }
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
    let [clean_url] = url.split('?');
    // remove index.html from the url to avoid mismatches
    clean_url = clean_url.replace(/\/index\.html?$/, '/');
    const normalized_method = is_string(method)
        ? method.trim().toLowerCase()
        : '';
    const found_cache_item = route_cache.find((item) => {
        return (
            clean_url.match(new RegExp(item.match)) &&
            in_array(item.methods, normalized_method)
        );
    });
    return found_cache_item;
}

export async function run_route(request, response, uid, route) {
    if (response === undefined) {
        // biome-ignore lint: noParameterAssign
        response = new SerializableResponse();
    }
    if (response && typeof response === 'object') {
        response.uid = uid;
    }
    if (!match_interface(request, { url: true })) {
        return [undefined, response];
    }

    // remove the get parameter from the url
    let [clean_url, query_params] = request.url.split('?');

    // replace the url of the request
    clean_url = clean_url.replace(/index\.html?/, '');

    // convert query parameters
    const query = {};
    if (query_params) {
        for (const entry of query_params.split('&')) {
            let [key, value] = entry.split('=');
            key = decodeURIComponent(key).replace(/\+/g, ' ');
            if (value === undefined) {
                query[key] = true;
                continue;
            }
            query[key] = decodeURIComponent(value).replace(/\+/g, ' ');
        }
    }
    const request_headers = request.headers || {};
    // parse certain parts of the request headers
    request_headers.visitor_languages = request_headers['accept-language']
        ? uniq_values(
              request_headers['accept-language']
                  .replace(/;.+$/, '')
                  .split(',')
                  .map((lang) => lang.split('-')[0])
          )
        : [];
    const body = request.body || {};
    const files = request.files || {};

    const params_match = clean_url.match(route.match);
    if (!params_match) {
        Logger.error(uid, "can't extract params from url", clean_url, route);
        return [undefined, response];
    }
    // get parameters from url
    const params = {};
    route.params.forEach((param, idx) => {
        params[param] = decodeURIComponent(
            params_match[idx + 1].replace(/\/$/, '').trim()
        );
    });
    params.isExec = !request.isNotExec;
    // get the route result
    const code = await load_route(route.path);

    if (is_null(code)) {
        return [undefined, response];
    }

    const error_message = (key) => `error in ${key} function`;

    // execute load function when set to get data
    let data = {
        $route: route,
        url: clean_url,
    };
    let status = 200;
    let header = {};
    let customHead = false;
    const request_cookies = get_cookies(request?.headers?.cookie);
    const response_cookies = {};
    let route_context = {
        request,
        response,
        params,
        headers: request_headers,
        cookies: request_cookies,
        query,
        body,
        files,
        data,
        isProd: Env.is_prod(),
        setStatus: (statusCode = 200) => {
            status = statusCode;
            customHead = true;
        },
        getStatus: () => {
            return status;
        },
        setHeader: (key, value) => {
            header[key] = value;
            customHead = true;
        },
        getHeaders: () => {
            return header;
        },
        getCookies: () => {
            return request_cookies;
        },
        setCookie: (key, value, options = {}) => {
            response_cookies[key] = { value, options };
            customHead = true;
            return true;
        },
        setRawCookie: (cookie) => {
            const [key, ...values] = cookie.split('=');
            response_cookies[key] = values.join('=');
            customHead = true;
            return true;
        },
        returnJSON: (json, status = 200, custom_headers = {}) => {
            const response_header = Object.assign({}, header, custom_headers);
            response_header['Content-Type'] = 'application/json';
            const returned_json = json === undefined ? 'null' : stringify(json);
            // biome-ignore lint: noParameterAssign
            response = end_response(
                response,
                returned_json,
                status,
                response_header,
                response_cookies
            );
        },
        returnData: (data, status = 200, custom_headers = {}) => {
            // biome-ignore lint: noParameterAssign
            response = end_response(
                response,
                data,
                status,
                Object.assign({}, header, custom_headers),
                response_cookies
            );
        },
        returnRedirect: (url, statusCode = 301, custom_headers = {}) => {
            const response_header = Object.assign({}, header, custom_headers, {
                Location: url,
            });
            if (Env.is_dev()) {
                Logger.info('Redirect to', url, response_header);
            }
            // biome-ignore lint: noParameterAssign
            response = end_response(
                response,
                `Redirect to ${url}`,
                statusCode,
                response_header,
                response_cookies
            );
        },
    };

    const construct_route_context = await Plugin.process(
        'construct_route_context',
        route_context
    );
    const construct_route_context_result = await construct_route_context(
        (route_object) => {
            return route_object;
        }
    );
    route_context = construct_route_context_result.result;

    if (is_func(code.onExec)) {
        /* c8 ignore next */
        const language = data?._wyvr?.language || 'en';
        register_i18n(get_language(language), route.path);
        try {
            data = await code.onExec(route_context);
            if (route_context?.response?.writableEnded) {
                return [undefined, response];
            }
        } catch (e) {
            Logger.error(
                '[route]',
                error_message('onExec'),
                get_error_message(e, route.path, 'route')
            );
        }
    }
    // when onExec does not return a correct object force one
    if (!data) {
        Logger.warning(
            '[route]',
            `onExec in ${route.path} should return a object`
        );
        data = route_context.data;
    }

    // add current data and url to the context for the next plugin
    data.url = clean_url;
    route_context.data = data;

    // added after the onExec to allow stopping the not found routines later on and reseting the headers
    const route_on_exec_context = await Plugin.process(
        'route_on_exec_context',
        route_context
    );
    const route_on_exec_context_result = await route_on_exec_context(
        (route_object) => {
            return route_object;
        }
    );
    route_context = route_on_exec_context_result.result;

    // apply cookies to header
    header = apply_cookies(header, response_cookies);

    if (request.method === 'OPTIONS') {
        const allow_methods = route.methods.join(',').toUpperCase();
        header.Allow = allow_methods;
        header['Access-Control-Allow-Methods'] = allow_methods;
    }

    // when customHead is set execute it
    if (customHead && response) {
        response.writeHead(status, undefined, header);
    }

    // end request when is marked as complete
    if (response?.complete) {
        return [undefined, response];
    }
    // head and options requests should not contain the content, only the headers
    if (in_array(['HEAD', 'OPTIONS'], request.method)) {
        response?.end();
        return [undefined, response];
    }

    // remove return helper, only allowed in onExec
    route_context.returnJSON = () => {
        Logger.warning('[route]', 'returnJSON can only be used in onExec');
    };
    route_context.returnData = () => {
        Logger.warning('[route]', 'returnData can only be used in onExec');
    };
    route_context.returnRedirect = () => {
        Logger.warning('[route]', 'returnRedirect can only be used in onExec');
    };

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
                    Logger.error(
                        '[route]',
                        error_message(key),
                        get_error_message(e, route.path, 'route')
                    );
                }
                return null;
            }
            data[key] = JSON.parse(JSON.stringify(code[key]));
            return undefined;
        })
    );
    // set the statusCode
    if (status !== 200) {
        response.statusCode = status;
    }

    data.url = clean_url;
    const page_data = await process_page_data(data, route.mtime);
    page_data._wyvr.is_exec = true;
    page_data._wyvr.route_pattern = route.url;

    // add data for routes to handle more complex cases in the svelte files
    page_data._wyvr.cookies = request_cookies;
    page_data._wyvr.headers = request_headers;
    page_data._wyvr.query = query;

    const page_content = generate_page_code(page_data);

    const route_result = await compile_server_svelte(page_content, route.path);

    const rendered_result = await render_server_compiled_svelte(
        route_result,
        page_data,
        route.path
    );

    /* c8 ignore start */
    // safeguard
    if (!rendered_result) {
        return [undefined, response];
    }
    /* c8 ignore end */

    if (rendered_result) {
        rendered_result.data = page_data;
    }
    const identifier = rendered_result.data?._wyvr?.identifier || 'default';
    const injected_result = await inject(
        rendered_result,
        page_data,
        route.path,
        identifier,
        (shortcode_emit) => {
            Logger.debug('shortcode', shortcode_emit);
            if (shortcode_emit) {
                if (!rendered_result.shortcode) {
                    rendered_result.shortcode = {};
                }
                shortcode_emit.type = undefined;
                rendered_result.shortcode[shortcode_emit.identifier] =
                    shortcode_emit;
            }
        }
    );

    rendered_result.result.html = injected_result.content;

    return [rendered_result, response];
}

function end_response(
    response,
    data,
    status = 200,
    headers = {},
    cookies = {}
) {
    response?.writeHead(status, undefined, apply_cookies(headers, cookies));
    response?.end(data);
    if (response) {
        response.complete = true;
    }
    return response;
}

function apply_cookies(header, cookies) {
    for (const [key, data] of Object.entries(cookies)) {
        const cookie =
            typeof data === 'string'
                ? `${key}=${data}`
                : set_cookie(key, data.value, data.options);
        if (!cookie) {
            continue;
        }
        if (typeof header['Set-Cookie'] === 'string') {
            header['Set-Cookie'] = [header['Set-Cookie']];
        }
        if (!Array.isArray(header['Set-Cookie'])) {
            header['Set-Cookie'] = [];
        }

        header['Set-Cookie'].push(cookie);
    }
    return header;
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
            const result = item.match(/^\[([^\]]+?)\]$/);
            if (result) {
                params.push(result[1]);
                return '([^\\]]+?)';
            }
            return item;
        })
        .join('\\/')}\\/?$`.replace('\\/\\/?$', '\\/?$');
    let methods = [
        'get',
        'head',
        'post',
        'put',
        'delete',
        'connect',
        'options',
        'trace',
        'patch',
    ];
    // execute _wyvr to get insights into the executable
    if (typeof result?._wyvr === 'function') {
        result._wyvr = await result._wyvr({});
    }
    if (filled_array(result?._wyvr?.methods)) {
        methods = result?._wyvr?.methods.filter((method) =>
            in_array(methods, method)
        );
    }

    // get specificity of the url, to detect the order of match checking
    const weight = url_parts.reduce((sum, part) => {
        let weight = 1000; // default weight of exact matches
        if (part.match(/^\[.*\]$/)) {
            weight = 100;
        }
        if (part === '.*' || part === '*' || !part.trim()) {
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

let fallback_route_cache;
let route_cache;
export function clear_caches() {
    route_cache = undefined;
    fallback_route_cache = undefined;
}
export function get_route_request(req) {
    if (!route_cache) {
        route_cache = get_config_cache('route.cache');
    }
    return get_route(req.url, req.method, route_cache);
}
export async function get_fallback_route() {
    if (fallback_route_cache) {
        return fallback_route_cache;
    }
    // @TODO check if this should be removed
    const fallback_file = Cwd.get(FOLDER_GEN_ROUTES, '_fallback.js');
    if (!exists(fallback_file)) {
        return false;
    }
    const result = await load_route(fallback_file);
    fallback_route_cache = await extract_route_config(result, fallback_file);
    fallback_route_cache.match = '.*';

    return fallback_route_cache;
}
