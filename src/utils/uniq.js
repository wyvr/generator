import { is_null, is_array } from './validate.js';
import { randomUUID } from 'node:crypto';

export function uniq_id() {
    return randomUUID().replace(/-/g, '');
}
export function uniq_values(list) {
    if (is_null(list)) {
        return [];
    }
    // force array
    if (!is_array(list)) {
        list = [list];
    }
    return list.filter((x, index, arr) => arr.indexOf(x) === index);
}
