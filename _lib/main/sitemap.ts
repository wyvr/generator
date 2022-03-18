import { Config } from '@lib/config';
import { File } from '@lib/file';
import { fail } from '@lib/helper/endings';
import { Logger } from '@lib/logger';
import { Plugin } from '@lib/plugin';
import { join } from 'path';
import { IPerformance_Measure } from '@lib/performance_measure';
import { ReleasePath } from '@lib/vars/release_path';
import { IBuildFileResult } from '@lib/interface/build';

export const sitemap = async (perf: IPerformance_Measure, pages: IBuildFileResult[]) => {
    perf.start('sitemap');
    /* eslint-disable @typescript-eslint/no-unused-vars */
    const [before_error, before_config, before_sitemaps] = await Plugin.before('sitemap', [
        {
            name: 'sitemap.xml',
            sitemaps: ['page-sitemap.xml'],
        },
        {
            name: 'page-sitemap.xml',
            entries: pages,
        },
    ]);
    /* eslint-enable */
    if (before_error) {
        Logger.error(before_error);
        fail();
    }
    const url = `${Config.get('https') ? 'https://' : 'http://'}${Config.get('url')}`;
    const size = 10000;
    // split when there are to many entries
    const splitted_sitemaps = [];
    const replace_sitemaps = {};
    const sitemaps = before_sitemaps
        .map((sitemap) => {
            if (sitemap.entries) {
                sitemap.entries = sitemap.entries
                    .filter((entry) => {
                        // remove private pages from the sitemap
                        return entry._wyvr.private !== true;
                    })
                    .sort((a, b) => {
                        return b._wyvr.priority - a._wyvr.priority || a.path.localeCompare(b.path);
                    });
                if (sitemap.entries.length > size) {
                    const amount = Math.ceil(sitemap.entries.length / size);
                    for (let i = 0; i < amount; i++) {
                        const clone = {
                            name: sitemap.name.replace(/\.xml/, `-${i + 1}.xml`),
                            entries: [],
                        };
                        if (!replace_sitemaps[sitemap.name]) {
                            replace_sitemaps[sitemap.name] = [];
                        }
                        replace_sitemaps[sitemap.name].push(clone.name);
                        clone.entries = sitemap.entries.slice(i * size, (i + 1) * size);
                        splitted_sitemaps.push(clone);
                    }
                    return null;
                }
            }
            return sitemap;
        })
        .filter((x) => x)
        .map((sitemap) => {
            if (sitemap.sitemaps) {
                const append_sitemap = [];
                const mod_sitemap = sitemap.sitemaps.filter((entry) => {
                    if (replace_sitemaps[entry]) {
                        append_sitemap.push(...replace_sitemaps[entry]);
                        return false;
                    }
                    return entry;
                });
                sitemap.sitemaps = mod_sitemap.concat(append_sitemap);
            }
            return sitemap;
        });
    const combined_sitemap = sitemaps.concat(splitted_sitemaps);
    /* eslint-disable @typescript-eslint/no-unused-vars */
    const [after_error, after_config, after_sitemaps] = await Plugin.after('sitemap', combined_sitemap);
    /* eslint-enable */
    if (after_error) {
        Logger.error(before_error);
        fail();
    }
    // build sitemap files
    after_sitemaps.forEach((sitemap) => {
        if (!sitemap || !sitemap.name) {
            Logger.error('sitemap is incorrect', JSON.stringify(sitemap));
            return;
        }

        const content = ['<?xml version="1.0" encoding="UTF-8"?>'];
        if (sitemap.sitemaps) {
            content.push('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
            content.push(
                sitemap.sitemaps
                    .map((entry) => {
                        return `<url>
            <loc>${url}/${entry}</loc>
         </url>`;
                    })
                    .join('')
            );
            content.push('</sitemapindex>');
        }
        if (sitemap.entries) {
            content.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
            content.push(
                sitemap.entries
                    .map((entry) => {
                        return `<url>
            <loc>${url}${File.remove_index(entry.path.replace(ReleasePath.get(), ''))}</loc>
            ${entry._wyvr.last_modified ? `<lastmod>${entry._wyvr.last_modified}</lastmod>` : ''}
            ${entry._wyvr.change_frequence ? `<changefreq>${entry._wyvr.change_frequence}</changefreq>` : ''}
            ${entry._wyvr.priority ? `<priority>${entry._wyvr.priority}</priority>` : ''}
         </url>`;
                    })
                    .join('')
            );
            content.push('</urlset>');
        }

        File.write(join(ReleasePath.get(), sitemap.name), content.join('').replace(/^\s+/gm, '').replace(/\n|\r/g, ''));
    });
    perf.end('sitemap');
    return;
};
