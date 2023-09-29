export function append_query_string(src, key, value) {
    if (!src || !value) {
        return src;
    }
    const sep = src.indexOf('?') > -1 ? '&' : '?';
    const key_data = key ? key + '=' : '';
    return src + sep + key_data + value;
}
