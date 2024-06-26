import { join } from 'node:path';
import { FOLDER_GEN_I18N, FOLDER_I18N } from '../constants/folder.js';
import { collect_files, read_json, write_json } from '../utils/file.js';
import { filled_array, filled_object, filled_string } from '../utils/validate.js';
import { Cwd } from '../vars/cwd.js';
import { stringify } from './json.js';

let language_cache = {};

/**
 * Collect the translations from packages and generate the languages
 * @param {array} packages the packages have to be ordered in ascending order of weight, to process the translations correctly
 * @param {*} fallback_language
 * @returns {any}
 */
export function collect_i18n(packages, fallback_language) {
    if (!filled_array(packages)) {
        return {};
    }
    const translations = {};
    for (const pkg of packages.filter(Boolean).reverse()) {
        if (!pkg || !pkg.path) {
            continue;
        }
        for (const file of collect_files(join(pkg.path, FOLDER_I18N))) {
            const i18n_folder = `/${FOLDER_I18N}/`;
            // search from last i18n not the first
            const search_path = file.split(i18n_folder).slice(-2).join(i18n_folder);
            const info = search_path.match(new RegExp(`.*?/${FOLDER_I18N}/([^/]+?)/(.+)\\.json$`));
            if (!info) {
                continue;
            }
            const data = read_json(file);
            if (!filled_object(data)) {
                continue;
            }

            const language = info[1];
            if (!translations[language]) {
                translations[language] = {};
            }
            const name = info[2];
            if (!translations[language][name]) {
                translations[language][name] = {};
            }
            for (const key of Object.keys(data)) {
                translations[language][name][key] = data[key];
            }
        }
    }
    // fill the translation with the translations from the base language
    if (fallback_language && translations[fallback_language]) {
        const base = translations[fallback_language];
        const languages = Object.keys(translations).filter((lang) => lang != fallback_language);
        for (const group of Object.keys(base)) {
            for (const key of Object.keys(base[group])) {
                for (const lang of languages) {
                    if (!translations[lang][group]) {
                        translations[lang][group] = {};
                    }
                    if (!translations[lang][group][key]) {
                        translations[lang][group][key] = base[group][key];
                    }
                }
            }
        }
    }
    // when no translations are set avoid that the file will not be generated
    if (fallback_language && !translations[fallback_language]) {
        translations[fallback_language] = {};
    }
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

export function clear_cache() {
    language_cache = {};
}

export function inject_language(content, language) {
    if (!filled_string(content)) {
        return '';
    }
    if (content.indexOf('</body>') === -1) {
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
