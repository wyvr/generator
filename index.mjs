
import { get_route_request, process_route_request } from './src/action/route.js';
import { get_error_message } from './src/utils/error.js';
import { Logger } from './src/utils/logger.js';
import { uniq_id } from './src/utils/uniq.js';

// magic values which are never used because they should be replaced while transformation
export const isServer = true;
export const isClient = false;
export async function onServer() {}

/**
 * Execute the given url
 * @param {string} url
 * @param {object} options
 * @returns Promise
 */
export async function execute_route(url, options) {
    const request = {
        url,
        path: url,
        method: options?.method || 'GET',
        isNotExec: true, // can indicate that the page is called from direct exec or not
        httpVersionMajor: 1,
        httpVersionMinor: 1,
        httpVersion: '1.1',
        complete: true,
        aborted: false,
        upgrade: false,
        statusCode: null,
        statusMessage: null,
        headers: options?.headers || {},
        data: options?.data || {},
        files: options?.files || {},
    };
    const uid = uniq_id();
    try {
        const exec = get_route_request(request);
        if (exec) {
            Logger.debug('exec', url, exec.url);
            return await process_route_request(request, undefined, uid, exec, false);
        }
    } catch (e) {
        Logger.error(get_error_message(e, url, 'cron'));
    }
    return false;
}
