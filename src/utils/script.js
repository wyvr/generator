import { Env } from '../vars/env.js';
import { get_file_time_hash } from './hash.js';
import { filled_string } from './validate.js';

/**
 * Get the js selector for all elements with the given name
 * @param {string} name
 * @returns {string}
 */
export function get_target(name) {
    if (!filled_string(name)) {
        return '';
    }
    return `const ${name}_target = document.querySelectorAll('[data-hydrate="${name}"]');`;
}

/**
 * Get the js code for instant execution
 * @param {string} name
 * @param {string} import_path
 * @param {string} target
 * @returns {string}
 */
export function get_instant_code(name, import_path, target) {
    if (!filled_string(name) || !filled_string(import_path)) {
        return '';
    }
    if (!filled_string(target)) {
        return `console.error('no target found for ${name} from ${import_path}');`;
    }
    const cache_breaker = Env.is_dev() ? `?${get_file_time_hash(import_path)}` : '';
    return [
        `import ${name} from '${import_path}${cache_breaker}';`,
        target,
        `wyvr_hydrate_instant(${name}_target, ${name});`,
    ].join('');
}
