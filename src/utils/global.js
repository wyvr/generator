import { I18N } from '../model/i18n.js';
import { Storage } from './storage.js';
import { get_error_message } from './error.js';
import { Logger } from './logger.js';
import { filled_string, is_func, is_null } from './validate.js';
import { FOLDER_STORAGE } from '../constants/folder.js';

export function register_inject(file) {
    global._inject_file = file;
    // replace the injectConfig functions with the corresponding values
    if (!is_func(global.injectConfig)) {
        global._inject = async (key, fallback, callback) => {
            let value;
            if (filled_string(key)) {
                const parts = key.split('.');
                const type = parts.shift();
                key = parts.join('.');

                Storage.set_location(FOLDER_STORAGE);
                value = await Storage.get(type, key);
            }
            if (is_null(value)) {
                value = fallback;
            }

            if (!is_func(callback)) {
                return value;
            }
            try {
                value = await callback(value);
            } catch (e) {
                Logger.warning(get_error_message(e, global._inject_file, 'inject'));
            }
            return value;
        };
    }
}
export function register_i18n(translations, file) {
    global._i18n_file = file;
    // replace the injectConfig functions with the corresponding values
    if (!is_func(global._i18n)) {
        const i18n = new I18N();
        global._i18n = i18n;
    }
    if (translations) {
        global._i18n.set(translations);
    }
    if (!is_func(global.__)) {
        global.__ = (key, options) => {
            const error = global._i18n.get_error(key, options);
            if (error) {
                Logger.warning(get_error_message({ name: 'i18n', message: error }, global._i18n_file, 'inject'));
            }
            return global._i18n.tr(key, options);
        };
    }
}
