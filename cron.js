import { get_error_message } from './src/utils/error.js';
import { Logger } from './src/utils/logger.js';
import { uniq_id } from './src/utils/uniq.js';
import { Config } from './src/utils/config.js';
import { get_page_from_url, update_pages_cache } from './src/utils/pages.js';
import { regenerate_pages } from './src/utils/regenerate.js';
import { Cwd } from './src/vars/cwd.js';
import { FOLDER_GEN } from './src/constants/folder.js';
import { WorkerController } from './src/worker/controller.js';
import { filled_array } from './src/utils/validate.js';
import { WorkerAction } from './src/struc/worker_action.js';
import { to_index } from './src/utils/file.js';
import { Env } from './src/vars/env.js';

/**
 * Execute the route for the given url
 * This can cause multiple pages to be regenerated at once
 *
 * @param {string} url
 * @param {object} options
 * @returns {Promise}
 */
export async function execute_route(url, options) {
    if (Env.is_dev()) {
        Logger.warning('route', url, 'will not be generated in dev mode');
        return false;
    }
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
        body: options?.body || {},
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
        Logger.error(get_error_message(e, url, 'cron route'));
    }
    return false;
}

/**
 * Execute the page for the given url
 * This can cause multiple pages to be regenerated at once
 * @param {string} url
 * @returns {Promise}
 */
export async function execute_page(url) {
    const page = get_page_from_url(url);

    if (!page) {
        return undefined;
    }
    try {
        const { pages, page_objects } = await regenerate_pages({ change: [page] }, {}, [], Cwd.get(FOLDER_GEN));
        if (!filled_array(pages)) {
            Logger.error('no pages were regenerated');
            return false;
        }
        update_pages_cache(page_objects);
        await WorkerController.process_in_workers(WorkerAction.build, pages, 100, true);

        Logger.improve(
            'persisted',
            page_objects.map((page) => page.urls.map((url) => to_index(url, 'html')).join(' ')).join(' ')
        );
        return page_objects;
    } catch (e) {
        Logger.error(get_error_message(e, url, 'cron page'));
    }
    return false;
}

/**
 * Get config value
 * @param {string} segment
 * @param {any} fallback_value
 * @returns {any}
 */
export function get_config(segment, fallback_value) {
    return Config.get(segment, fallback_value);
}

/**
 * Get logger instance
 * @returns {Logger}
 */
export function get_logger() {
    return Logger;
}
