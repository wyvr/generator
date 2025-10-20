import { PLUGIN_I18N } from '../constants/plugins.js';
import { get_config_cache } from '../utils/config_cache.js';
import { collect_i18n, write_language } from '../utils/i18n.js';
import { Logger } from '../utils/logger.js';
import { Plugin } from '../utils/plugin.js';
import { measure_action } from './helper.js';

export async function i18n(available_packages, minimize_output) {
    const name = 'i18n';
    const i18n_config_data = get_config_cache('i18n');

    let languages = [];
    await measure_action(
        name,
        async () => {
            // wrap in plugin
            const i18n = collect_i18n(available_packages, i18n_config_data?.fallback || 'en');
            const caller = await Plugin.process(PLUGIN_I18N, i18n);
            await caller(async (i18n) => {
                languages = Object.keys(i18n).map((language) => {
                    write_language(language, i18n[language]);
                    return language;
                });
                Logger.info('found', languages.length, 'languages', Logger.color.dim(languages.join(',')));
                return i18n;
            });
        },
        minimize_output
    );
    return languages;
}
