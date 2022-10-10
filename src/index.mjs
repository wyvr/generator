import { get_exec_request, process_exec_request } from './action/exec.js';
import { get_error_message } from './utils/error.js';
import { Logger } from './utils/logger.js';
import { uniq_id } from './utils/uniq.js';

/**
 * Execute the given url
 * @param {string} url
 * @param {object} options
 * @returns Promise
 */
export async function exec(url, options) {
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
        const exec = get_exec_request(request);
        if (exec) {
            Logger.debug('exec', url, exec.url);
            return await process_exec_request(request, undefined, uid, exec, false);
        }
    } catch (e) {
        Logger.error(get_error_message(e, url, 'cron'));
    }
    return false;
}
