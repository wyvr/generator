import { I18N } from '../model/i18n.js';
import { get_error_message } from './error.js';
import { Logger } from './logger.js';
import { filled_string, is_func, is_null } from './validate.js';
import { FOLDER_PROP } from '../constants/folder.js';
import { create_hash } from './hash.js';
import { exists, write } from './file.js';
import { stringify } from './json.js';
import { ReleasePath } from '../vars/release_path.js';
import { getRequestId } from '../vars/request_id.js';
import { KeyValue } from './database/key_value.js';

export function register_inject(file) {
    global._inject_file = file;
    // replace the injectConfig functions with the corresponding values
    if (!is_func(global.injectConfig)) {
        global._inject = async (key, fallback, callback) => {
            let value;
            if (filled_string(key)) {
                const parts = key.split('.');
                const type = parts.shift();
                const parent_key = parts.join('.');

                try {
                    const db = new KeyValue(type);
                    value = db.get(parent_key);
                } catch (e) {
                    Logger.error(get_error_message(e, global._inject_file, 'inject'));
                }
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
export function register_prop(file) {
    global._prop_file = file;
    // replace the injectConfig functions with the corresponding values
    if (is_func(global._prop)) {
        return;
    }
    global._prop = (prop, value) => {
        if (value === undefined) {
            return `|${prop}|:null`;
        }
        const converted = stringify(value);
        if (converted.length > 1000) {
            const hash = create_hash(converted, 64);
            const file_name = `/${FOLDER_PROP}/${prop}_${hash}.json`;
            const release_path = ReleasePath.get(file_name);
            if (!exists(release_path)) {
                write(release_path, converted);
            }
            return `|${prop}|:|@(${file_name})|`;
        }
        return `|${prop}|:${converted.replace(/\|/g, '§|§').replace(/"/g, '|').replace(/\{/g, '«').replace(/\}/g, '»')}`;
    };
}

const stackContext = new Map();
/**
 * Create the global methods to handle the stack data which can be used to transform data between server and client per page
 * @returns void
 */
export function register_stack() {
    if (is_func(global.setStack)) {
        return;
    }
    global.setStack = (key, value) => {
        if (filled_string(key)) {
            const data = stackContext.get(getRequestId()) ?? {};
            // @TODO validate to allow only syncronizable data inside here
            if (value !== undefined) {
                data[key] = value;
            } else {
                delete data[key];
            }
            stackContext.set(getRequestId(), data);
        }
        return value;
    };
    global.getStack = (key, fallback) => {
        if (!filled_string(key)) {
            return fallback;
        }
        const data = stackContext.get(getRequestId()) ?? {};
        return data[key] ?? fallback;
    };
    global.clearStack = () => {
        stackContext.delete(getRequestId());
    };
    global.dumpStack = () => {
        return stackContext.get(getRequestId()) ?? {};
    };
}
