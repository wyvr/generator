export function to_media_config(hash) {
    if (typeof hash != 'string' || hash.length == 0) {
        return {};
    }
    const config = {};
    const map = {
        w: 'width',
        h: 'height',
        m: 'mode',
        f: 'format',
        x: 'ext',
        q: 'quality'
    };
    hash.split(',')
        .filter((part) => part.indexOf(':') > -1)
        .forEach((part) => {
            part = part.trim();
            const [key, value] = part.split(':');
            if (!map[key]) {
                return;
            }
            config[map[key]] = ['w', 'h', 'q'].indexOf(key) > -1 ? parseInt(value, 10) : value;
        });

    return config;
}
export function to_media_hash(config) {
    if (typeof config != 'object' || Array.isArray(config)) {
        return '';
    }
    const map = {
        format: 'f',
        height: 'h',
        mode: 'm',
        quality: 'q',
        width: 'w',
        ext: 'x'
    };
    const default_values = {
        format: 'jpeg',
        height: -1,
        mode: 'cover',
        quality: 60,
        width: -1,
        ext: undefined
    };

    return Object.entries(map)
        .map(([prop, key]) => {
            if (!config[prop] || default_values[prop] === config[prop]) {
                return undefined;
            }
            return key + ':' + (config[prop] + '').trim();
        })
        .filter(Boolean)
        .join(',');
}
