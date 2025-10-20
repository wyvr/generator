import { get_config } from 'wyvr/cron.js';
import { KeyValue } from 'wyvr/storage.js';
import { STORAGE_COLLECTION } from 'wyvr/src/constants/storage.js';
import { write } from "wyvr/src/utils/file.js";
import { ReleasePath } from 'wyvr/src/vars/release_path.js';
import { CHUNK_SIZE, get_chunks, get_sitemap_content, get_sitemap_index_content } from '$src/wyvr/sitemap.js';


export default async function ({ isProd }) {
    if (!isProd) {
        return;
    }
    const domain = `https://${get_config('url')}`;

    // load all entries from the collection
    const collection_db = new KeyValue(STORAGE_COLLECTION);
    const data = collection_db.all();
    // show only active entries
    const active_entries = data?.all?.filter((entry) => entry.visible) || [];

    // split into chunks to avoid hugh sitemap files, which can nopt be parsed
    const chunks = get_chunks(active_entries, CHUNK_SIZE);
    // when only one file avoid generating an index
    if (chunks.length <= 1) {
        write(ReleasePath.get('sitemap.xml'), get_sitemap_content(domain, chunks[0]));
        return;
    }

    // generate sitemap index and sitemap files
    const indexes = [];
    for (const chunk of chunks) {
        const index = `sitemap_${indexes.length + 1}.xml`;
        write(ReleasePath.get(index), get_sitemap_content(domain, chunk));

        const newestDate = chunk.reduce((latest, entry) => {
            if (!entry?.mtime?.mtime) {
                return latest;
            }
            const date = new Date(entry.mtime.mtime);
            if (!latest) {
                return date;
            }
            return date > latest ? date : latest;
        }, undefined);

        indexes.push({ url: index, mtime: { mtime: newestDate?.toISOString() } });
    }
    write(ReleasePath.get('sitemap.xml'), get_sitemap_index_content(domain, chunks[0]));

}
