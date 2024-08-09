import { to_index, write } from '../utils/file.js';
import { Logger } from '../utils/logger.js';
import { Plugin } from '../utils/plugin.js';
import { is_array } from '../utils/validate.js';
import { Env } from '../vars/env.js';
import { ReleasePath } from '../vars/release_path.js';
import { measure_action } from './helper.js';
import { KeyValue } from '../../storage.js';
import { STORAGE_COLLECTION } from '../constants/storage.js';

export async function sitemap() {
    if (Env.is_dev()) {
        return;
    }
    const name = 'sitemap';

    await measure_action(name, async () => {
        const collection_db = new KeyValue(STORAGE_COLLECTION);

        const data = collection_db.all();

        // wrap in plugin
        const caller = await Plugin.process(name, data);
        await caller(async (data) => {
            Logger.debug('sitemap', data);
            if (is_array(data)) {
                const active_entries = data.filter((entry) => entry.visible);
                // Logger.info('result', JSON.stringify(active_entries, null, 4));
                const sitemap_content = [
                    '<?xml version="1.0" encoding="UTF-8"?>',
                    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
                    active_entries.map((entry) => `<url><loc>${to_index(entry.url)}</loc><lastmod>${entry.mtime}</lastmod></url>`).join('\n'),
                    '</urlset>'
                ].join('\n');
                write(ReleasePath.get('sitemap.xml'), sitemap_content);
            }
        });
    });
}
