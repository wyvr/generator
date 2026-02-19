import { filled_string } from '../src/utils/validate.js';
import {
    read_json,
    write_json
} from '../src/utils/file.js';
import { get_config_cache_path } from '../src/utils/config_cache.js';
import { join } from 'node:path';

import './server_only.js';

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
