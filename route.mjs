
import { get_error_message } from './src/utils/error.js';
import { Logger } from './src/utils/logger.js';
import { uniq_id } from './src/utils/uniq.js';

/**
 * Execute the given url
 * @param {string} url
 * @param {object} options
 * @returns Promise
 */
export async function execute_route(url, options) {
    const { get_route_request, process_route_request } = await import('./src/action/route.js');
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
