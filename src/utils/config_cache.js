import { FOLDER_CACHE } from '../constants/folder.js';
import { Cwd } from '../vars/cwd.js';
import { IsWorker } from '../vars/is_worker.js';
import { WorkerController } from '../worker/controller.js';
import { Config } from './config.js';
import { read_json, write_json } from './file.js';
import { Plugin } from './plugin.js';
import { filled_string, is_null } from './validate.js';

/**
 * Get the config value from the given segment
 *
 * @param {string|null} segment The specific segment of the config cache for which the data
 *                              is needed. If not a filled string, the function will return
 *                              fallback_value.
 * @param {*} fallback_value A value that should be returned if no cached value could be found
 *                           for the provided segment. It can be any type.
 *
 * @returns {*} The config value for the given segment
 */
export function get_config_cache(segment, fallback_value) {
    if (!filled_string(segment)) {
        return fallback_value;
    }
    let value = Config.get(segment);
    if (!is_null(value)) {
        return value;
    }
    if (!IsWorker.get()) {
        const path = get_config_cache_path(segment);
        const cache = read_json(path);
        if (is_null(cache)) {
            return fallback_value;
        }
        Config.set(segment, cache);
    }
    return Config.get(segment, fallback_value);
}

/**
 * Set the config and persist the value and publish to the workers
 * @param {string} segment
 * @param {any} value
 * @param {boolean} send_to_workers
 * @returns {void}
 */
export async function set_config_cache(segment, value, send_to_workers = true) {
    if (!filled_string(segment)) {
        return;
    }
    Config.set(segment, value);
    if (IsWorker.get()) {
        // worker
        if (segment == 'plugin_files') {
            /* restore the plugins from the files,
             * because the plugins can not be sent to the workers,
             * because they contain functions which are not serializable
             */
            await Plugin.restore(value);
        }
    } else {
        // is main
        const path = get_config_cache_path(segment);
        write_json(path, value);
        if (send_to_workers) {
            WorkerController.set_config_cache_all_workers(segment, value);
        }
    }
}

/**
 * Retrieve the absolute path to the config file
 * @param {string} segment
 * @returns {string} absolute path the the config file
 */
export function get_config_cache_path(segment) {
    if (!filled_string(segment)) {
        return undefined;
    }
    const main = segment.replace(/\./g, '_');
    return Cwd.get(FOLDER_CACHE, `${main}.json`);
}

/**
 * Publish the config with the given segment to the workers
 * @param {string} segment
 */
export function pub_config_cache(segment) {
    const value = get_config_cache(segment);
    if (value) {
        WorkerController.set_config_cache_all_workers(segment, value);
    }
}
