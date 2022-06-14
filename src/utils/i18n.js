import { join } from 'path';
import { FOLDER_GEN_I18N, FOLDER_I18N } from '../constants/folder.js';
import { I18N } from '../model/i18n.js';
import { collect_files, read_json, write_json } from '../utils/file.js';
import { filled_array, filled_string, is_func } from '../utils/validate.js';
import { Cwd } from '../vars/cwd.js';

const language_cache = {};

export function collect_i18n(packages) {
    if (!filled_array(packages)) {
        return {};
    }
    const translations = {};
    packages.forEach((pkg) => {
        if (!pkg || !pkg.path) {
            return;
        }
        collect_files(join(pkg.path, FOLDER_I18N)).forEach((file) => {
            const info = file.match(new RegExp(`.+/${FOLDER_I18N}/([^/]+)/(.+)\\.json`));
            if (!info) {
                return;
            }
            const language = info[1];
            if (!translations[language]) {
                translations[language] = {};
            }
            const name = info[2];
            if (!translations[language][name]) {
                translations[language][name] = {};
            }
            const data = read_json(file);
            Object.keys(data).forEach((key) => {
                translations[language][name][key] = data[key];
            });
        });
    });
    return translations;
}

export function write_language(language, data) {
    if (!filled_string(language)) {
        return false;
    }
    language = language.toLowerCase();
    const path = join(Cwd.get(), FOLDER_GEN_I18N, `${language}.json`);
    return write_json(path, data);
}

export function register_i18n() {
    // replace the injectConfig functions with the corresponding values
    if (!is_func(global.wyvr_i18n)) {
        const i18n = new I18N();
        global.wyvr_i18n = i18n;
    }
    if (!is_func(global.__)) {
        global.__ = global.wyvr_i18n.tr;
    }
}

export function get_language(language) {
    if (!filled_string(language)) {
        language = 'en';
    }
    language = language.toLowerCase();
    // load from cache
    if (language_cache[language]) {
        return language_cache[language];
    }
    // load from file
    language_cache[language] = read_json(join(Cwd.get(), FOLDER_GEN_I18N, `${language}.json`));
    return language_cache[language];
}
