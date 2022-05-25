import { collect_i18n, write_language } from '../utils/i18n.js';

export function i18n(available_packages) {
    const i18n = collect_i18n(available_packages);
    Object.keys(i18n).forEach((language) => {
        write_language(language, i18n[language]);
    });
}
