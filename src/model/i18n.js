import { search_segment } from '../utils/segment.js';
import { filled_string, is_object, is_null, is_string, is_number } from '../utils/validate.js';

export class I18N {
    constructor(translations) {
        this.set(translations);
    }
    set(translations) {
        this.data = translations;
    }
    tr(key, options) {
        if (!this.data) {
            return key;
        }
        const tr = this.replace(search_segment(this.data, key), options);
        if (!filled_string(tr)) {
            return key;
        }
        return tr;
    }
    replace(value, options) {
        if (is_null(value)) {
            return undefined;
        }
        let result = this.plural(value, options);
        if (is_object(options)) {
            const keys = Object.keys(options);
            // remove dead markers
            result = result.replace(/\{([^}]*?)\}/g, (match, key) => {
                if (keys.indexOf(key) > -1) {
                    return match;
                }
                return '';
            });
            keys.forEach((key) => {
                // allow only strings and numbers in the result
                if (!is_string(options[key]) && !is_number(options[key])) {
                    options[key] = JSON.stringify(options[key]);
                }
                /* eslint-disable no-useless-escape */
                // escaping is here not useless
                result = result.replace(new RegExp(`\{${key}\}`, 'g'), options[key]);
                /* eslint-enable */
            });
        }
        return result;
    }
    plural(value, options) {
        if (!is_object(value)) {
            return value;
        }
        // has no count property, use general plural
        if (is_null(options?.count)) {
            return value._ || '';
        }
        // found exact matches
        if (!is_null(value[options.count])) {
            return value[options.count];
        }
        let found_plural = null;
        const keys = Object.keys(value);
        // check greater then
        keys.filter((plural) => plural.indexOf('>') > -1)
            .map((key) => ({ key, value: parseFloat(key.replace('>', '').trim()) }))
            .sort((a, b) => b.value - a.value)
            .find((entry) => {
                const found = options.count > entry.value;
                if (found) {
                    found_plural = entry.key;
                }
                return found;
            });
        if (found_plural) {
            return value[found_plural];
        }
        // check lighter then
        keys.filter((plural) => plural.indexOf('<') > -1)
            .map((key) => ({ key, value: parseFloat(key.replace('<', '').trim()) }))
            .sort((a, b) => a.value - b.value)
            .find((entry) => {
                const found = options.count < entry.value;
                if (found) {
                    found_plural = entry.key;
                }
                return found;
            });
        if (found_plural) {
            return value[found_plural];
        }
        // when not found use general plural
        return value._ || '';
    }
    get_error(key, options) {
        if (!this.data) {
            return 'missing translations';
        }
        const tr = search_segment(this.data, key);
        if (!tr) {
            return `missing key "${key}"`;
        }
        if (is_object(tr) && (is_null(options) || is_null(options.count))) {
            return `missing "count" option for key "${key}"`;
        }
        return undefined;
    }
}
