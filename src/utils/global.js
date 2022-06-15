import { I18N } from '../model/i18n.js';
import { Storage } from './storage.js';
import { get_error_message } from './error.js';
import { Logger } from './logger.js';
import { filled_string, is_func, is_null } from './validate.js';
import { FOLDER_STORAGE } from '../constants/folder.js';

export function register_inject(file) {
    global.inject_file = file;
    // replace the injectConfig functions with the corresponding values
    if (!is_func(global.injectConfig)) {
        global._inject = async (key, fallback, callback) => {
            if (!filled_string(key)) {
                return fallback;
            }
            const parts = key.split('.');
            const type = parts.shift();
            key = parts.join('.');

            Storage.set_location(FOLDER_STORAGE);
            let value = await Storage.get(type, key);
            if(is_null(value)) {
                value = fallback;
            }

            if (!is_func(callback)) {
                return value;
            }
            try {
                value = await callback(value);
            } catch (e) {
                Logger.warning(get_error_message(e, global.inject_file, 'inject'));
            }
            return value;
        };
    }
}
export function register_i18n(translations) {
    // replace the injectConfig functions with the corresponding values
    if (!is_func(global.wyvr_i18n)) {
        const i18n = new I18N();
        global.wyvr_i18n = i18n;
    }
    if (translations) {
        global.wyvr_i18n.set(translations);
    }
    if (!is_func(global.__)) {
        global.__ = (...args) => global.wyvr_i18n.tr(...args);
    }
}
