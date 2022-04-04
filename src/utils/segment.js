import { is_object, is_string } from './validate.js';

export function search_segment(search_in, segment, fallback_value) {
    if (!is_object(search_in) || !is_string(segment)) {
        return fallback_value;
    }

    const segments = segment.split('.');

    const value = segments.reduce((acc, cur) => {
        if (is_object(acc) && acc[cur]) {
            return acc[cur];
        }
        return fallback_value;
    }, search_in);

    return value;
}
