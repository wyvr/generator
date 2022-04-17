import { is_big_int, is_number } from './validate.js';

export function nano_to_milli(value) {
    if (!is_number(value)) {
        return undefined;
    }
    if (is_big_int(value)) {
        return Math.round(Number(value / BigInt(1000000)));
    }
    return Math.round(value / 1000000);
}
