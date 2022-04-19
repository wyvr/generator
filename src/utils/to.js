import { is_object, is_array, is_null, filled_string } from './validate.js';

export function to_string(value) {
    if (is_null(value)) {
        return value + '';
    }
    if (is_object(value) || is_array(value)) {
        return JSON.stringify(value);
    }
    return value.toString();
}

export function to_snake_case(value) {
    if(!filled_string(value)) {
        return undefined;
    }
    return value
        .replace(/([A-Z])/g, '_$1')
        .toLowerCase()
        .replace(/^_/, '')
        .replace(/[^a-z_]/g, '_')
        .replace(/_+/g, '_');
}