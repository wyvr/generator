import { minify } from 'html-minifier';
import { STORAGE_OPTIMIZE_HASHES, STORAGE_OPTIMIZE_MEDIA_QUERY_FILES } from '../constants/storage.js';
import { Env } from '../vars/env.js';
import { critical_css_enabled, critical_css_exists, critical_css_set, get_critical_css, insert_critical_css } from './critical.js';
import { KeyValue } from './database/key_value.js';
import { get_error_message } from './error.js';
import { Logger } from './logger.js';
import { filled_array, filled_string } from './validate.js';

const hashes_db = new KeyValue(STORAGE_OPTIMIZE_HASHES);
const media_query_files_db = new KeyValue(STORAGE_OPTIMIZE_MEDIA_QUERY_FILES);

/**
 * Replace all file references in the content with the hash path
 * @param {string} content
 * @param {boolean} replace whether the content should be replaced or not
 * @returns the replaced content
 */
export function replace_files_with_content_hash(content) {
    if (!filled_string(content)) {
        return undefined;
    }
    const keys = hashes_db.keys();
    return keys.reduce((acc, cur) => {
        if (acc.indexOf(cur) === -1) {
            return acc;
        }
        return acc.replace(new RegExp(cur, 'g'), hashes_db.get(cur)?.path ?? cur);
    }, content);
}

export async function optimize_content(content, identifier) {
    if (Env.is_dev() || !filled_string(content)) {
        return content;
    }
    if (content.indexOf('<html') === -1) {
        // avoid minifying the content if it's not an html file
        return content;
    }

    const steps = [insert_media_query_files, replace_files_with_content_hash];
    // when identifier is given try to generate the critical css
    if (filled_string(identifier)) {
        steps.push((content) => insert_critical_css(content, identifier));
        if (!critical_css_exists(identifier) && critical_css_enabled()) {
            // @NOTE generate as late as possible otherwise some resources are not available
            Logger.warning('generate critical css for', identifier);
            const css = await get_critical_css(content, identifier);
            if (css) {
                critical_css_set(identifier, css, []);
            }
        }
    }

    // replace the files with the hash path and add the critical css
    const replaced_content = steps.reduce((acc, cur) => cur(acc), content);

    try {
        const minified_content = minify(replaced_content, {
            collapseBooleanAttributes: true,
            collapseInlineTagWhitespace: true,
            collapseWhitespace: true,
            continueOnParseError: true,
            removeAttributeQuotes: true,
            removeComments: true,
            removeScriptTypeAttributes: true,
            removeStyleLinkTypeAttributes: true,
            useShortDoctype: true
        });
        return minified_content;
    } catch (e) {
        Logger.error(get_error_message(e, null, 'minify'));
        return replaced_content;
    }
}

export function insert_media_query_files(content) {
    if (!filled_string(content)) {
        return '';
    }
    const media_query_links = [];

    const keys = media_query_files_db.keys();
    for (const css_file of keys) {
        if (content.indexOf(css_file) > -1) {
            const medias_query_files = media_query_files_db.get(css_file);
            if (!media_query_files_db) {
                continue;
            }
            for (const media of Object.keys(medias_query_files)) {
                media_query_links.push(`<link href="${medias_query_files[media]}" rel="stylesheet" media="${media}">`);
            }
        }
    }
    if (!filled_array(media_query_links)) {
        return content;
    }
    return content.replace('</head>', `${media_query_links.join('')}</head>`);
}
