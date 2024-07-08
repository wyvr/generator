import { get_error_message } from './error.js';
import { Logger } from './logger.js';
import { filled_string, is_null, is_object } from './validate.js';

export function stringify(item, spaces) {
    try {
        return JSON.stringify(item, undefined, spaces);
    } catch (e) {
        if (
            e.message.indexOf(' circular ') > -1 ||
            e.message.indexOf(' circle ') > -1
        ) {
            // in case of an error try to avoid circular references, this can be to aggressive so it is avoided
            // because items with the same value, even when not nested inside another
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
        throw e;
    }
}
export function parse(string) {
    if (!filled_string(string)) {
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
    // @NOTE: structuredClone clones circular references, which can cause a stack overflows further down the line
    return parse(stringify(item));
}
