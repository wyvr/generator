import { I18N } from '../model/i18n.js';
import { Storage } from './storage.js';
import { get_error_message } from './error.js';
import { Logger } from './logger.js';
import { filled_string, is_func, is_null } from './validate.js';
import { FOLDER_GEN, FOLDER_PROP, FOLDER_STORAGE } from '../constants/folder.js';
import { create_hash } from './hash.js';
import { exists, write } from './file.js';
import { stringify } from './json.js';
import { Cwd } from '../vars/cwd.js';
import { join } from 'node:path';
import { ReleasePath } from '../vars/release_path.js';

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

                Storage.set_location(FOLDER_STORAGE);
                value = await Storage.get(type, parent_key);
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
            const release_path = join(ReleasePath.get(), file_name);
            if (!exists(release_path)) {
                write(release_path, converted);
            }
            return `|${prop}|:|@(${file_name})|`;
        }
        return `|${prop}|:${converted.replace(/\|/g, '§|§').replace(/"/g, '|')}`;
    };
}
let stackData = {};
/**
 * Create the global methods to handle the stack data which can be used to transform data between server and client per page
 * @returns void
 */
export function register_stack() {
    if (is_func(global.setStack)) {
        return;
    }
    global.setStack = (key, value) => {
        if (typeof key === 'string' && key) {
            // @TODO validate to allow only syncronizable data inside here
            stackData[key] = value;
        }
        return value;
    };
    global.getStack = (key, fallback) => {
        if (typeof key === 'string' && key) {
            return stackData[key] ?? fallback;
        }
        return fallback;
    };
    global.stackClear = () => {
        stackData = {};
    };
    global.stackExtract = () => {
        return stackData;
    };
}
