import { Config } from '../src/utils/config.js';

import './server_only.js';

/**
 * Get config value
 * @param {string} segment
 * @param {any} fallback_value
 * @returns {any}
 */
export function get_config(segment, fallback_value) {
    return Config.get(segment, fallback_value);
}
