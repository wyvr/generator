import { v4 } from 'uuid';
import { is_null, is_array } from './validate.js';

export function uniq() {
    return v4().replace(/-/g, '');
}
export function uniq_values(list) {
    if(is_null(list)) {
        return [];
    }
    // force array
    if(!is_array(list)) {
        list = [list];
    }
    return list.filter((x, index, arr) => arr.indexOf(x) == index);
}