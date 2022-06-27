import { I18N } from '@lib/model/i18n.js';

window._i18n = new I18N({});

window.__ = (key, options) => {
    const error = window._i18n.get_error(key, options);
    if (error) {
        console.warn('i18n', error);
    }
    return window._i18n.tr(key, options);
};
