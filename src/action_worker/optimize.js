import { filled_array } from '../utils/validate.js';
import { Buffer } from 'node:buffer';
import minifyHtml from '@minify-html/node';
import { read, write } from '../utils/file.js';
import { Logger } from '../utils/logger.js';
import { extname, join } from 'path';
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import { get_error_message } from '../utils/error.js';
import { to_relative_path } from '../utils/to.js';
import { ReleasePath } from '../vars/release_path.js';

export async function optimize(files) {
    if (!filled_array(files)) {
        return false;
    }
    const hash_keys = Object.keys(global.cache.hashes);
    const media_query_files_keys = Object.keys(global.cache.media_query_files);
    // create map of the critical css and file relation
    const file_critical_map = {};
    for (const identifier of Object.keys(global.cache.critical)) {
        for (const file of global.cache.critical[identifier].files) {
            file_critical_map[file] = identifier;
        }
    }

    for (const file of files) {
        try {
            let content = read(file);
            if (!content) {
                content = '';
            }
            // replace media query files
            const media_query_links = [];
            for (const media_query_file of media_query_files_keys) {
                if (content.indexOf(media_query_file) > -1) {
                    for (const media of Object.keys(global.cache.media_query_files[media_query_file])) {
                        media_query_links.push(`<link href="${global.cache.media_query_files[media_query_file][media]}" rel="stylesheet" media="${media}">`);
                    }
                }
            }
            if (filled_array(media_query_links)) {
                content = content.replace('</head>', `${media_query_links.join('')}</head>`);
            }
            // replace the hashed files
            for (const key of hash_keys) {
                if (content.indexOf(key)) {
                    content = content.replace(new RegExp(key, 'g'), global.cache.hashes[key].path);
                }
            }
            switch (extname(file)) {
                case '.html':
                case '.htm': {
                    const rel_file = to_relative_path(file);
                    // insert critical css
                    if (file_critical_map[rel_file]) {
                        content = content.replace('</head>', `<style id="critical">${global.cache.critical[file_critical_map[rel_file]]?.css}</style></head>`);
                    }
                    try {
                        const minified_content = minifyHtml.minify(Buffer.from(content), {
                            do_not_minify_doctype: true,
                            ensure_spec_compliant_unquoted_attribute_values: true,
                            keep_closing_tags: true,
                            keep_html_and_head_opening_tags: true,
                            keep_spaces_between_attributes: true,
                            keep_comments: false,
                            keep_input_type_text_attr: false,
                            keep_ssi_comments: false,
                            preserve_brace_template_syntax: false,
                            preserve_chevron_percent_template_syntax: false,
                            minify_css: true,
                            minify_js: true,
                            remove_bangs: true,
                            remove_processing_instructions: true
                        });

                        write(file, minified_content);
                    } catch (e) {
                        Logger.error(get_error_message(e, file, 'minify'));
                    }
                    break;
                }
                case '.css': {
                    try {
                        const file_hash = global.cache.hashes[to_relative_path(file)];
                        if (!file_hash) {
                            break;
                        }
                        const result = await postcss([cssnano({ plugins: [autoprefixer] })]).process(content, {
                            from: undefined
                        });
                        write(join(ReleasePath.get(), file_hash.path), result.css);
                    } catch (e) {
                        Logger.error(get_error_message(e, file, 'css'));
                    }
                    break;
                }
                case '.cjs':
                case '.mjs':
                case '.js': {
                    const file_hash = global.cache.hashes[to_relative_path(file)];
                    if (!file_hash) {
                        break;
                    }
                    write(join(ReleasePath.get(), file_hash.path), content);
                    break;
                }
            }
        } catch (e) {
            Logger.error(get_error_message(e, file, 'optimize'));
        }
    }
    return true;
}
