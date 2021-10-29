(function I18N() {
    let data = {};
    function get(key) {
        if (!data || !key) {
            return null;
        }
        const parts = key.split('.');
        if (parts.length == 0) {
            return null;
        }
        return parts.reduce((acc, cur) => {
            if (!acc) {
                return null;
            }
            return acc[cur];
        }, data);
    }
    function replace(value, options) {
        if (!value) {
            return null;
        }
        value = plural(value, options);
        if (options && typeof options == 'object') {
            Object.keys(options).forEach((key) => {
                // allow only strings and numbers in the result
                if (typeof options[key] != 'string' || typeof options[key] != 'number') {
                    options[key] = JSON.stringify(options[key]);
                }
                if (typeof value != 'string') {
                    value = '';
                }
                value = value.replace(new RegExp(`\{${key}\}`, 'g'), options[key]);
            });
        }
        // remove dead markers
        return value.replace(/\{[^\}]*?\}/g, '');
    }
    function plural(value, options) {
        if (typeof value == 'object') {
            // has no count property, use general plural
            if (options.count == null) {
                return value['_'] || '';
            }
            // found simple
            if (value[options.count] != null) {
                return value[options.count];
            }
            let found_plural = null;
            // check greater then
            Object.keys(value)
                .filter((plural) => plural.indexOf('>') > -1)
                .map((key) => ({ key, value: parseFloat(key.replace('>', '').trim()) }))
                .sort((a, b) => b.value - a.value)
                .find((entry) => {
                    const found = options.count > entry.value;
                    if (found) {
                        found_plural = entry.key;
                    }
                    return found;
                });
            if (!found_plural) {
                // check lighter then
                Object.keys(value)
                    .filter((plural) => plural.indexOf('<') > -1)
                    .map((key) => ({ key, value: parseFloat(key.replace('>', '').trim()) }))
                    .sort((a, b) => a.value - b.value)
                    .find((entry) => {
                        const found = options.count < entry.value;
                        if (found) {
                            found_plural = entry.key;
                        }
                        return found;
                    });
            }

            if (!found_plural) {
                return value['_'] || '';
            }
            return value[found_plural];
        }
        return value;
    }
    return {
        init: (translations) => {
            data = translations;
        },
        __: (key, options) => {
            if (!data) {
                return `[${key}]`;
            }
            const tr = replace(get(key), options);
            if (!tr) {
                return `[${key}]`;
            }
            return tr;
        },
        check: (key, options) => {
            if (!data) {
                return 'missing translations';
            }
            const tr = get(key);
            if (!tr) {
                return `missing key "${key}"`;
            }
            if (typeof tr == 'object' && options && options.count == null) {
                return `missing "count" option for key "${key}"`;
            }
            return null;
        },
        get: get,
    };
})();
