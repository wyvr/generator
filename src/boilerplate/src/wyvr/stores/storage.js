export function load(key, fallback) {
    if (!key || !localStorage) {
        return fallback;
    }
    const value = localStorage.getItem(key);
    if (value) {
        try {
            return JSON.parse(value);
        } catch (e) {
            console.warn('storage load error', key, e);
        }
    }
    return fallback;
}
export function save(key, value) {
    if (!key || !localStorage) {
        return false;
    }

    if (value == null) {
        localStorage.removeItem(key);
        return true;
    }
    let store_value = '';
    if (typeof value == 'string') {
        store_value = value;
    } else {
        try {
            store_value = JSON.stringify(value);
        } catch (e) {
            console.error('storage stringify value', key, e);
        }
    }
    try {
        localStorage.setItem(key, store_value);
    } catch (e) {
        console.error('storage', key, e);
    }
    return true;
}
export function watch(key) {}
