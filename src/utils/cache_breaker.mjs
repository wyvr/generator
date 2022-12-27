import { filled_string } from './validate.js';

export function get_cache_breaker(create_cache_breaker = true) {
    if (!create_cache_breaker) {
        return '';
    }
    return `?${Date.now()}`;
}
export function append_cache_breaker(file, create_cache_breaker = true) {
    if (!filled_string(file)) {
        return '';
    }
    return file + get_cache_breaker(create_cache_breaker);
}
