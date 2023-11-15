import { I18N } from '[lib]/model/i18n.js';

window._i18n = new I18N(window._translations || {});

// load the language
const language = document.querySelector('html').getAttribute('lang') || 'en';
fetch(`/i18n/${language}.json?${window.build_id || '_'}`)
    .then((response) => response.json())
    .then((data) => window._i18n.set(data));

window.__ = (key, options) => {
    const error = window._i18n.get_error(key, options);
    if (error) {
        /* eslint-disable no-console */
        console.warn('i18n', error);
        /* eslint-enable no-console */
    }
    return window._i18n.tr(key, options);
};
