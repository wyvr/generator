import { is_big_int, is_number } from './validate.js';

function divide(value, divide_by) {
    if (!is_number(value) || !is_number(divide_by)) {
        return undefined;
    }
    if (is_big_int(value)) {
        return Math.round(Number(value / BigInt(divide_by)));
    }
    return Math.round(value / divide_by);
}

export function nano_to_milli(value) {
    return divide(value, 1000000);
}
export function nano_to_base(value) {
    return divide(value, 1000000000);
}
