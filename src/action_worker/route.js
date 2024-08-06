import { appendFileSync } from 'node:fs';
import { filled_array, filled_string, in_array } from '../utils/validate.js';
import { WorkerEmit } from '../struc/worker_emit.js';
import { WorkerAction } from '../struc/worker_action.js';
import { send_action } from '../worker/communication.js';
import { Logger } from '../utils/logger.js';
import { uniq_id } from '../utils/uniq.js';
import { SerializableResponse } from '../model/serializable/response.js';
import { send_content, send_head } from '../utils/server.js';
import { get_route_request, run_route } from '../utils/routes.js';
import { join } from 'node:path';
import { ReleasePath } from '../vars/release_path.js';
import {
    FOLDER_CACHE,
    FOLDER_CSS,
    FOLDER_GEN_JS,
    FOLDER_JS,
} from '../constants/folder.js';
import { copy, exists, write, to_index } from '../utils/file.js';
import { scripts } from './scripts.js';
import { Cwd } from '../vars/cwd.js';
import { Env } from '../vars/env.js';
import { optimize_content } from './../utils/optimize.js';

export async function route(requests) {
    if (!filled_array(requests)) {
        return [];
    }
    const responses = [];
    for (const request of requests) {
        const route = get_route_request(request);
        if (!route) {
            continue;
        }
        const uid = request.uid ?? uniq_id();
        const force_generating_of_resources =
            request.force_generating_of_resources || false;
        Logger.debug('route', request.url, route.url);

        const response = await send_process_route_request(
            request,
            new SerializableResponse(),
            uid,
            route,
            force_generating_of_resources
        );
        responses.push(response?.serialize() || response);
        const route_emit = {
            type: WorkerEmit.route,
            response: response?.serialize() || response,
        };
        // append url, to identify the routes in the event
        route_emit.response.url = request.url;
        send_action(WorkerAction.emit, route_emit);
    }
    return responses;
}

/**
 * Process and set the response headers so that the result can be displayed in the browser
 * @param {IncomingMessage} req
 * @param {SerializableResponse} res
 * @param {string} uid
 * @param {any} route
 * @param {boolean} force_generating_of_resources
 * @returns {SerializableResponse}
 */
export async function send_process_route_request(
    req,
    res,
    uid,
    route,
    force_generating_of_resources
) {
    let [result, response] = await process_route_request(
        req,
        res,
        uid,
        route,
        force_generating_of_resources
    );
    if (result?.result?.html && !response.complete) {
        response = send_head(response, response.statusCode ?? 200, 'text/html');
        response = send_content(response, result.result.html);
    }
    return response;
}

/**
 * Process the given request as the found route and return the generated result and the response, because routes can alter the response
 * @param {IncomingMessage} req
 * @param {SerializableResponse} res
 * @param {string} uid
 * @param {any} route
 * @param {boolean} force_generating_of_resources
 * @returns {[any, SerializableResponse]}
 */
export async function process_route_request(
    req,
    res,
    uid,
    route,
    force_generating_of_resources
) {
    const [result, response] = await run_route(req, res, uid, route);

    // end non data requests
    if (in_array(['HEAD', 'OPTIONS'], req.method)) {
        return [result, response];
    }

    // write css
    if (
        filled_string(result?.data?._wyvr?.identifier) &&
        result?.result?.css?.code
    ) {
        // @TODO use hash path from storage hashes
        const css_file_path = ReleasePath.get(
            FOLDER_CSS,
            `${result.data._wyvr.identifier}.css`
        );
        if (!exists(css_file_path) || force_generating_of_resources) {
            write(css_file_path, result.result.css.code);
        }
    }
    const js_path = join(
        ReleasePath.get(),
        FOLDER_JS,
        `${result?.data?._wyvr?.identifier || 'default'}.js`
    );
    const identifiers = result?.shortcode || {};
    const generate_identifier =
        result?.data?._wyvr?.identifier_data &&
        (!exists(js_path) || force_generating_of_resources);
    if (generate_identifier) {
        // script only accepts an object
        identifiers[result.data._wyvr.identifier_data.identifier] =
            result?.data._wyvr.identifier_data;
        // save the file to gen
    }
    if (Object.keys(identifiers).length > 0) {
        const generate_identifiers = Object.keys(identifiers)
            .map((key) => identifiers[key])
            .filter(Boolean);
        // @TODO extract most of this whole file into worker_actions or a util
        await scripts(generate_identifiers);
    }
    if (generate_identifier) {
        // @TODO use hash path from storage hashes
        copy(
            Cwd.get(FOLDER_GEN_JS, `${result.data._wyvr.identifier}.js`),
            js_path
        );
    }

    // remove query parameters to avoid generating wrong files
    const [url] = req.url.split('?');

    // optimize the content
    if (result?.result?.html) {
        result.result.html = await optimize_content(
            result.result.html,
            result.data._wyvr.identifier
        );
    }

    // persist the result
    // except:
    // - in dev mode
    // - if the response is a success 2XX
    // - if the result is empty
    // - if the route is not set to persist in the wyvr config object
    if (
        result?.result?.html &&
        result?.data?._wyvr?.persist &&
        Env.is_prod() &&
        response.statusCode >= 200 &&
        response.statusCode < 300
    ) {
        const file = to_index(url, 'html');
        const persisted_path = ReleasePath.get(file);
        write(persisted_path, result.result.html);
        Logger.improve('persisted', file);
        // add marker to identify which file where generated before
        const persisted_routes_file = Cwd.get(
            FOLDER_CACHE,
            'routes_persisted.txt'
        );
        appendFileSync(persisted_routes_file, `${file}\n`, { flag: 'a+' });
    }
    return [result, response];
}
