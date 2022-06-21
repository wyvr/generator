import { get_error_message } from './error.js';
import { Logger } from './logger.js';
import { filled_string, is_null, is_object } from './validate.js';

export function stringify(item, spaces) {
    const cache = [];
    return JSON.stringify(
        item,
        (key, value) => {
            if (!is_object(value) || is_null(value)) {
                return value;
            }
            // Circular reference
            if (cache.indexOf(value) >= 0) {
                return undefined;
            }
            cache.push(value);
            return value;
        },
        spaces
    );
}
export function parse(string) {
    if(!filled_string(string)) {
        return undefined;
    }
    try {
        return JSON.parse(string);
    } catch (e) {
        Logger.error(get_error_message(e, undefined, 'parse'));
        return undefined;
    }
}

export function clone(item) {
    return parse(stringify(item));
}
