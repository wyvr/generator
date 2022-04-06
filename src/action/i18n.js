import { join } from 'path';
import { FOLDER_I18N } from '../constants/folder.js';
import { collect_files, read_json } from '../utils/file.js';
import { filled_array } from '../utils/validate.js';

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
