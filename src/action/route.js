import { get_fallback_route } from '../utils/routes.js';
import { Logger } from '../utils/logger.js';
import { match_interface } from '../utils/validate.js';
import { Plugin } from '../utils/plugin.js';
import { SerializableRequest } from '../model/serializable/request.js';
import { route, send_process_route_request } from '../action_worker/route.js';
import { STATUS_CODES } from 'node:http';
import { stringify } from '../utils/json.js';
import { get_error_message } from '../utils/error.js';
import { Env } from '../vars/env.js';
import { PLUGIN_ROUTES } from '../constants/plugins.js';

/**
 * Process route from an request
 * @param {IncomingMessage} req
 * @param {Response} res
 * @param {string} uid
 * @param {boolean} force_generating_of_resources
 * @returns {Response|false} response
 */
export async function route_request(req, res, uid, force_generating_of_resources) {
    const name = 'route';

    let response;

    // create serializable request object
    const ser_req = SerializableRequest(req, {
        uid,
        force_generating_of_resources
    });

    // wrap in plugin
    const caller = await Plugin.process(PLUGIN_ROUTES, [ser_req]);
    await caller(async (requests) => {
        const responses = await route(requests);
        response = responses.find(Boolean);
    });

    if (!response) {
        return false;
    }

    return response;
}

export async function fallback_route_request(req, res, uid) {
    // @TODO move to the worker
    const fallback_route = await get_fallback_route();
    if (!fallback_route) {
        return false;
    }
    const response = await send_process_route_request(req, res, uid, fallback_route, false);
    return response;
}

export function clean_header_text(value, allow_spaces = true) {
    // arrays are allowed in some cases for headers
    if (Array.isArray(value)) {
        return value.map((v) => clean_header_text(v, allow_spaces));
    }
    /*
    @SEE https://github.com/nodejs/node/issues/17390
        token          = 1*tchar
        tchar          = "!" / "#" / "$" / "%" / "&" / "'" / "*"
                        / "+" / "-" / "." / "^" / "_" / "`" / "|" / "~"
                        / DIGIT / ALPHA
                        ; any VCHAR, except delimiters
    */
    // Replace any non-allowed characters with a percent-encoded value
    const regexp = new RegExp(`[^${allow_spaces ? ' ' : ''}\\w"'!#$%&*+-/.:,;^=\`|?]+`, 'g');
    return value.replace(/\n\t\r/g, '').replace(regexp, (match) => {
        return encodeURIComponent(match);
    });
}

/**
 * Apply the changes from the serializeable response to the given response
 * @param {Response} response
 * @param {SerializableResponse} ser_response
 * @returns {Response}
 */
export function apply_response(response, ser_response) {
    if (!ser_response) {
        return response;
    }
    const headerable_response = typeof response.setHeader === 'function';
    response.wyvr = true;
    response.statusCode = ser_response.statusCode;
    response.statusText = STATUS_CODES[ser_response.statusCode];
    // try fix headers
    try {
        if (ser_response.headers) {
            const cleaned_headers = {};
            for (const [key, value] of Object.entries(ser_response.headers)) {
                const clean_key = clean_header_text(key, false);
                const clean_value = clean_header_text(value);
                if (Env.is_debug() && (clean_key !== key || JSON.stringify(clean_value) !== JSON.stringify(value))) {
                    if (clean_key !== key) {
                        Logger.warning(`cleaned response header entry key ${JSON.stringify(key)} => ${JSON.stringify(clean_key)}`);
                    }
                    if (JSON.stringify(clean_value) !== JSON.stringify(value)) {
                        Logger.warning(
                            `cleaned response header entry value ${JSON.stringify(clean_key)}\n- original ${JSON.stringify(value)}\n- cleaned ${JSON.stringify(clean_value)}`
                        );
                    }
                }

                cleaned_headers[clean_key] = clean_value;
            }
            ser_response.headers = cleaned_headers;
        }
    } catch (e) {
        Logger.error(get_error_message(e, ser_response.url, 'response clean header'));
    }
    // when the response is real
    if (headerable_response) {
        try {
            for (const [key, value] of Object.entries(ser_response.headers)) {
                response.setHeader(key, value);
            }
        } catch (e) {
            Logger.error(get_error_message(e, ser_response.url, 'response set header'));
        }
    } else {
        // when headers should be contained multiple times, like multiple set-cookie headers this is not possible here
        response.headers = ser_response.headers;
    }

    // when the response has not been ended the fallback route reuses the response
    if (!ser_response.complete) {
        return response;
    }

    try {
        response.writeHead(response.statusCode, response.headers);
    } catch (e) {
        Logger.error(get_error_message(e, response.url, 'response write header'));
    }

    if (Buffer.isBuffer(ser_response.data)) {
        response.end(ser_response.data);
        return response;
    }
    // convert serialized buffer back to buffer
    if (match_interface(ser_response.data, { type: true, data: true })) {
        response.end(Buffer.from(ser_response.data));
        return response;
    }
    if (typeof ser_response.data === 'string') {
        response.end(ser_response.data);
        return response;
    }
    if (ser_response.data === undefined) {
        response.end();
        return response;
    }
    const data = stringify(ser_response.data);
    Logger.warning('Response data has unknown format', typeof ser_response.data, Logger.color.dim(data.length > 100 ? `${data.substring(0, 100)}...` : data));
    return response;
}
