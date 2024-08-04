import { minify } from 'html-minifier';
import { STORAGE_OPTIMIZE_HASHES } from '../constants/storage.js';
import { Env } from '../vars/env.js';
import {
    critical_css_exists,
    critical_css_set,
    get_critical_css,
    insert_critical_css,
} from './critical.js';
import { KeyValue } from './database/key_value.js';
import { get_error_message } from './error.js';
import { Logger } from './logger.js';
import { filled_string } from './validate.js';

let hash_keys;
const hashes_db = new KeyValue(STORAGE_OPTIMIZE_HASHES);

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
    if (!hash_keys) {
        hash_keys = hashes_db.keys();
    }
    return hash_keys.reduce((acc, cur) => {
        if (acc.indexOf(cur) === -1) {
            return acc;
        }
        return acc.replace(
            new RegExp(cur, 'g'),
            hashes_db.get(cur)?.path ?? cur
        );
    }, content);
}

export async function optimize_content(content, identifier) {
    if (Env.is_dev() || !filled_string(content) || !filled_string(identifier)) {
        return content;
    }
    if (content.indexOf('<html') === -1) {
        // avoid minifying the content if it's not an html file
        return content;
    }
    // replace the files with the hash path and add the critical css
    const replaced_content = replace_files_with_content_hash(
        insert_critical_css(content, identifier)
    );

    if (!critical_css_exists(identifier)) {
        // @NOTE generate as late as possible otherwise some resources are not available
        Logger.warning('generate critical css for', identifier);
        const css = await get_critical_css(replaced_content, identifier);
        if (css) {
            critical_css_set(identifier, css, []);
        }
    }
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
            useShortDoctype: true,
        });
        return minified_content;
    } catch (e) {
        Logger.error(get_error_message(e, null, 'minify'));
        return replaced_content;
    }
}
