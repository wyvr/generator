/**
 * Check if the given value is a string
 * @param {any} value
 * @returns boolean
 */
export function is_string(value) {
    return typeof value === 'string';
}

/**
 * Check if the given value is a string and not empty
 * @param {any} value
 * @returns boolean
 */
export function filled_string(value) {
    return is_string(value) && value.trim() !== '';
}

/**
 * Check if the given value is a number
 * @param {any} value
 * @returns boolean
 */
export function is_number(value) {
    return typeof value === 'number' || typeof value === 'bigint';
}

/**
 * Check if the given value is an integer
 * @param {any} value
 * @returns boolean
 */
export function is_int(value) {
    return typeof value === 'number';
}

/**
 * Check if the given value is a float number
 * @param {any} value
 * @returns boolean
 */
export function is_float(value) {
    return is_int(value) && `${value}`.indexOf('.') > -1;
}

/**
 * Check if the given value is a big int
 * @param {any} value
 * @returns boolean
 */
export function is_big_int(value) {
    return typeof value === 'bigint';
}

/**
 * Check if the given value is an array
 * @param {any} value
 * @returns boolean
 */
export function is_array(value) {
    return Array.isArray(value);
}
/**
 * Check if the given value is an array and not empty
 * @param {any} value
 * @returns boolean
 */
export function filled_array(value) {
    return is_array(value) && value.length > 0;
}

export function in_array(array, value) {
    if (!filled_array(array) || (!is_string(value) && !is_number(value))) {
        return false;
    }
    return array.indexOf(value) > -1;
}

/**
 * Check if the given value is an object
 * @param {any} value
 * @returns boolean
 */
export function is_object(value) {
    return (
        typeof value === 'object' &&
        value != null &&
        !Array.isArray(value) &&
        !is_regex(value) &&
        !is_date(value)
    );
}

/**
 * Check if the given value is an object and not empty
 * @param {any} value
 * @returns boolean
 */
export function filled_object(value) {
    return is_object(value) && Object.keys(value).length > 0;
}

/**
 * Check if the given value is a symbol
 * @param {any} value
 * @returns boolean
 */
export function is_symbol(value) {
    return typeof value === 'symbol';
}

/**
 * Check if the given value is a date object
 * @param {any} value
 * @returns boolean
 */
export function is_date(value) {
    return value instanceof Date;
}

/**
 * Check if the given value is a regexp object
 * @param {any} value
 * @returns boolean
 */
export function is_regex(value) {
    return value instanceof RegExp;
}

/**
 * Check if the given value is null or undefined
 * @param {any} value
 * @returns boolean
 */
export function is_null(value) {
    return value === undefined || value === null;
}

/**
 * Check if the given value is boolean
 * @param {any} value
 * @returns boolean
 */
export function is_bool(value) {
    return typeof value === 'boolean';
}

/**
 * Check if the given value is a function
 * @param {any} value
 * @returns boolean
 */
export function is_func(value) {
    return typeof value === 'function';
}

/**
 * Check if the given value is a valid path string, used in imports
 * @param {any} value
 * @returns boolean
 */
export function is_path(value) {
    if (!filled_string(value)) {
        return false;
    }
    if (
        value.indexOf('.') === 0 ||
        value.indexOf('/') === 0 ||
        value.indexOf('$src') === 0 ||
        value.indexOf('@src') === 0 // @deprecated
    ) {
        return true;
    }
    return false;
}

/**
 * Check if the given value is a valid buffer
 * @param {any} value
 * @returns boolean
 */
export function is_buffer(value) {
    return Buffer.isBuffer(value);
}

/**
 * Check if the given value matches the given structure
 * @param {any} value
 * @param {any} structure
 * @returns boolean
 */
export function match_interface(value, structure) {
    if (!is_object(value) || !is_object(structure)) {
        return false;
    }
    const required_keys = Object.keys(structure).filter(
        (key) => structure[key]
    );
    const object_keys = Object.keys(value);

    return required_keys.every((key) => in_array(object_keys, key));
}
