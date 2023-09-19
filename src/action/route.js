import { get_fallback_route } from '../utils/routes.js';
import { Logger } from '../utils/logger.js';
import { match_interface } from '../utils/validate.js';

import { WorkerAction } from '../struc/worker_action.js';
import { Plugin } from '../utils/plugin.js';
import { WorkerController } from '../worker/controller.js';
import { SerializableRequest } from '../model/serializable/request.js';
import { WorkerEmit, get_name } from '../struc/worker_emit.js';
import { Event } from '../utils/event.js';
import { send_process_route_request } from '../action_worker/route.js';

const route_name = get_name(WorkerEmit.route);

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
        force_generating_of_resources,
    });

    const route_id = Event.on('emit', route_name, (data) => {
        if (!data) {
            return;
        }
        // set the response only when the url is equal to the requested
        if (data?.response?.url === req.url) {
            response = data?.response;
        }
    });
    // wrap in plugin
    const caller = await Plugin.process(name, [ser_req]);
    await caller(async (requests) => {
        await WorkerController.process_in_workers(WorkerAction.route, requests, 1, true);
    });
    Event.off('emit', route_name, route_id);

    if (!response) {
        return false;
    }

    return apply_response(res, response);
}

export async function fallback_route_request(req, res, uid) {
    // @TODO move to the worker
    const fallback_route = await get_fallback_route();
    if (!fallback_route) {
        return res;
    }
    const response = await send_process_route_request(req, res, uid, fallback_route, false);
    return apply_response(res, response);
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

    response.writeHead(ser_response.statusCode, ser_response.headers);

    if (!ser_response.complete) {
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
    Logger.warning('Response data has unknown format', typeof ser_response.data);
    return response;
}
