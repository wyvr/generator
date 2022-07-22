import { join } from 'path';
import { FOLDER_GEN_I18N, FOLDER_I18N } from '../constants/folder.js';
import { collect_files, read_json, write_json } from '../utils/file.js';
import { filled_array, filled_object, filled_string } from '../utils/validate.js';
import { Cwd } from '../vars/cwd.js';
import { stringify } from './json.js';

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
            const i18n_folder = `/${FOLDER_I18N}/`;
            // search from last i18n not the first
            const search_path = file.split(i18n_folder).slice(-2).join(i18n_folder);
            const info = search_path.match(new RegExp(`.*?/${FOLDER_I18N}/([^/]+?)/(.+)\\.json$`));
            if (!info) {
                return;
            }
            const data = read_json(file);
            if (!filled_object(data)) {
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
    const path = Cwd.get(FOLDER_GEN_I18N, `${language}.json`);
    return write_json(path, data);
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
    language_cache[language] = read_json(Cwd.get(FOLDER_GEN_I18N, `${language}.json`));
    return language_cache[language];
}

export function clear_language(language) {
    if (!filled_string(language)) {
        return false;
    }
    language = language.toLowerCase();
    if (language_cache[language]) {
        language_cache[language] = undefined;
        return true;
    }
    return false;
}

export function inject_language(content, language) {
    if (!filled_string(content)) {
        return '';
    }
    if (content.indexOf('</body>') == -1) {
        return content;
    }
    const data = get_language(language);
    if (!data) {
        return content;
    }
    return content.replace(
        /<\/body>/,
        `<script>
    window._translation = ${stringify(data)};

    if(window._i18n) {
        window._i18n.set(window._translation);
    }
    </script>`
    );
}
