import { Logger } from './logger.js';
import { is_string } from './validate.js';

/**
 * Checks whether the given path contains reserved words
 * @param {string} path
 * @returns {boolean}
 */
export function contains_reserved_words(path) {
    if (!is_string(path)) {
        return false;
    }
    return !!path.match(/^\/?(?:assets|css|devtools|i18n|js|media)\//);
}

/**
 * Returns if the given path contains reserved words and print error message if it does
 * @param {string} path
 * @returns {boolean}
 */
export function is_path_valid(path) {
    if (!is_string(path)) {
        return true;
    }
    const contains = contains_reserved_words(path);
    if (contains) {
        Logger.error('path', path, 'contains reserved words');
    }
    return !contains;
}
