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
        if(!value) {
            return null;
        }
        if (options && typeof options == 'object') {
            Object.keys(options).forEach((key) => {
                // allow only strings and numbers in the result
                if (typeof options[key] != 'string' || typeof options[key] != 'number') {
                    options[key] = JSON.stringify(options[key]);
                }
                value = value.replace(new RegExp(`\{${key}\}`, 'g'), options[key]);
            });
        }
        // remove dead markers
        return value.replace(/\{[^\}]*?\}/g, '');
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
            if(!tr) {
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
            return null;
        },
        get: get,
    };
})();
