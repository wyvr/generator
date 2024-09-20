import { join } from "node:path";
import { to_index } from "@wyvr/generator/src/utils/file.js";

export const CHUNK_SIZE = 10000;

export function get_chunks(entries, size) {
    const chunks = [];
    for (let i = 0; i < entries.length; i += size) {
        chunks.push(entries.slice(i, i + size));
    }
    return chunks;
}

export function get_sitemap_content(domain, entries) {
    return [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        entries.map((entry) => `<url><loc>${join(domain, to_index(entry.url))}</loc><lastmod>${entry.mtime?.mtime || ''}</lastmod></url>`).join('\n'),

        '</urlset>'
    ].join('\n');
}

export function get_sitemap_index_content(domain, entries) {
    return [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        entries.map(entry => `<sitemap><loc>${join(domain, to_index(entry.url))}</loc><lastmod>${entry.mtime?.mtime || ''}</lastmod></sitemap>`).join('\n'),
        '</sitemapindex>'
    ].join('\n');
}
