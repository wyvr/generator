import i18next from 'i18next';
import { Env } from '@lib/env';
import { Logger } from '@lib/logger';

export class I18N {
    static is_setup: false;
    static async setup() {
        if (this.is_setup) {
            return;
        }
        i18next.on('languageChanged', function (lng) {
            Logger.info('[i18n]','changed language', lng);
        });
        i18next.on('loaded', function (loaded) {
            Logger.info('[i18n]','loaded', loaded);
        });
        i18next.on('failedLoading', function (lng, ns, msg) {
            Logger.error('[i18n]','failedLoading', lng, ns, msg);
        });
        i18next.on('missingKey', function (lngs, namespace, key, res) {
            Logger.warning('[i18n]', `missing key "${key}" in "${namespace}" language ${lngs.join(',')}`);
        });
        await i18next.init({
            fallbackLng: 'en',
            debug: false,
            saveMissing: true, // needed to emit missingKey
        });
    }
    static translate(key: string | string[], options?: any) {
        I18N.setup();
        return i18next.t(key, options);
    }
}
