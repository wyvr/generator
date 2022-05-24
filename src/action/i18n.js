import { join } from 'path';
import { FOLDER_GEN, FOLDER_I18N } from '../constants/folder.js';
import { collect_files, read_json, write_json } from '../utils/file.js';
import { filled_array, filled_string } from '../utils/validate.js';
import { Cwd } from '../vars/cwd.js';

export function i18n(available_packages) {
    const i18n = collect_i18n(available_packages);
    Object.keys(i18n).forEach((language) => {
        write_language(language, i18n[language]);
    });
}

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
    const path = join(Cwd.get(), FOLDER_GEN, FOLDER_I18N, `${language.toLowerCase()}.json`);
    return write_json(path, data);
}
