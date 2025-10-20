import { get_error_message as gem } from './src/utils/error.js';
import { Logger } from './src/utils/logger.js';
import { uniq_id } from './src/utils/uniq.js';
import { Config } from './src/utils/config.js';
import { get_page_from_url, update_pages_cache } from './src/utils/pages.js';
import { regenerate_pages } from './src/utils/regenerate.js';
import { Cwd } from './src/vars/cwd.js';
import { FOLDER_GEN } from './src/constants/folder.js';
import { WorkerController } from './src/worker/controller.js';
import { filled_array, filled_string } from './src/utils/validate.js';
import { WorkerAction } from './src/struc/worker_action.js';
import {
    remove_index,
    read_json,
    write_json,
    to_index,
    rename,
    remove,
    exists
} from './src/utils/file.js';
import { Env } from './src/vars/env.js';
import { get_route_request } from './src/utils/routes.js';
import { process_route_request } from './src/action_worker/route.js';
import { register_stack } from './src/utils/global.js';
import { get_config_cache_path } from './src/utils/config_cache.js';
import { join } from 'node:path';
import { ReleasePath } from './src/vars/release_path.js';

if (typeof window !== 'undefined' || typeof process === 'undefined') {
    throw new Error(
        'This module is only allowed in server runtimes like Node.js, if you see this error please report it to the library author.'
    );
}

register_stack();

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
    const request = {
        url: remove_index(url),
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
            return await process_route_request(
                request,
                undefined,
                uid,
                exec,
                false
            );
        }
    } catch (e) {
        Logger.error(gem(e, url, 'execute route'));
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
        const { pages, page_objects } = await regenerate_pages(
            { change: [page] },
            {},
            [],
            Cwd.get(FOLDER_GEN)
        );
        if (!filled_array(pages)) {
            Logger.error('no pages were regenerated');
            return false;
        }
        update_pages_cache(page_objects);
        await WorkerController.process_in_workers(
            WorkerAction.build,
            pages,
            100,
            true
        );

        Logger.improve(
            'persisted',
            page_objects.map((page) => page.urls.join(' ')).join(' ')
        );
        return page_objects;
    } catch (e) {
        Logger.error(get_error_message(e, url, 'execute page'));
    }
    return false;
}


export async function remove_url(url) {
    const path = ReleasePath.get(to_index(url));
    if(!exists(path)) {
        return false;
    }
    await clear_props(path);
    return remove(path);
}

export async function clear_props(path) {
    // - [ ] get all props from the path
    // - [ ] search other files with the same props
    // - [ ] remove the props when not in the other files
    // @(/prop/data_7405e085e1cccae903f8d87e41c6da03f9b91e05147f70ee5d590f5596eeca5e.json)

    const { exec } = require('node:child_process');

    function executeCommand(command) {
        return new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    reject(`Error: ${error.message}`);
                    return;
                }
                if (stderr) {
                    reject(`Stderr: ${stderr}`);
                    return;
                }
                resolve(stdout);
            });
        });
    }
    
    // Example usage:
    executeCommand('ls -la')
        .then(result => {
            console.log('Command output:', result);
        })
        .catch(error => {
            console.error('Command error:', error);
        });
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
 * Retrieves the cache data for the specified cache name and scope.
 * @param {string} cache_name - The name of the cache.
 * @param {string} [scope='default'] - The scope of the cache. Defaults to 'default'.
 * @returns {object} - The cache data as a JavaScript object.
 */
export function get_cache(cache_name, scope = 'default') {
    return read_json(get_cache_path(cache_name, scope));
}

/**
 * Sets the cache with the specified name and value.
 * @param {string} cache_name - The name of the cache.
 * @param {any} value - The value to be stored in the cache.
 * @param {string} [scope='default'] - The scope of the cache (optional, default is 'default').
 * @returns {boolean} - Returns true if the cache is successfully set, false otherwise.
 */
export function set_cache(cache_name, value, scope = 'default') {
    if (!filled_string(cache_name)) {
        return false;
    }
    return write_json(get_cache_path(cache_name, scope), value);
}

/**
 * Returns the cache path for a given cache name and scope.
 * @param {string} cache_name - The name of the cache.
 * @param {string} [scope='default'] - The scope of the cache. Defaults to 'default'.
 * @returns {string} The cache path.
 */
export function get_cache_path(cache_name, scope = 'default') {
    const cache_key = join(
        scope,
        cache_name
            .replace(/^\//, '')
            .replace(/\/$/, '')
            .replace(/\//g, '|')
            .replace(/[^\w|/]/g, '-')
    );

    return get_config_cache_path(cache_key);
}

/**
 * Converts the specified URL to a ghost file.
 * @param {string} url - The URL to convert.
 * @returns {Promise} - A promise that resolves to the converted ghost file.
 */
export function convert_to_ghost_file(url) {
    const file_path = ReleasePath.get(to_index(url));
    return rename(file_path, 'index.ghost');
}
