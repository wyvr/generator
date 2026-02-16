import { Config } from '../src/utils/config.js';

if (typeof window !== 'undefined' || typeof process === 'undefined') {
    throw new Error(
        'This module is only allowed in server runtimes like Node.js, if you see this error please report it to the library author.'
    );
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
