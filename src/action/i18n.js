import { collect_i18n, write_language } from '../utils/i18n.js';
import { Logger } from '../utils/logger.js';
import { Plugin } from '../utils/plugin.js';
import { measure_action } from './helper.js';

export async function i18n(available_packages, minimize_output) {
    const name = 'i18n';

    let languages = [];
    await measure_action(name, async () => {
        // wrap in plugin
        const caller = await Plugin.process(name, available_packages);
        await caller(async (available_packages) => {
            const i18n = collect_i18n(available_packages);
            languages = Object.keys(i18n).map((language) => {
                write_language(language, i18n[language]);
                return language;
            });
            Logger.info('found', languages.length, 'languages', Logger.color.dim(languages.join(',')));
        });
    }, minimize_output);
    return languages;
}
