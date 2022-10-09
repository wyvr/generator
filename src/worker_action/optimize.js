import { filled_array } from '../utils/validate.js';
import { minify } from 'html-minifier';
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
    Object.keys(global.cache.critical).forEach((identifier) => {
        global.cache.critical[identifier].files.forEach((file) => {
            file_critical_map[file] = identifier;
        });
    });

    for (const file of files) {
        try {
            let content = read(file);
            // replace media query files
            const media_query_links = [];
            media_query_files_keys.forEach((media_query_file) => {
                if (content.indexOf(media_query_file) > -1) {
                    Object.keys(global.cache.media_query_files[media_query_file]).forEach((media) =>
                        media_query_links.push(
                            `<link href="${global.cache.media_query_files[media_query_file][media]}" rel="stylesheet" media="${media}">`
                        )
                    );
                }
            });
            if (filled_array(media_query_links)) {
                content = content.replace('</head>', media_query_links.join('') + '</head>');
            }
            // replace the hashed files
            hash_keys.forEach((key) => {
                if (content.indexOf(key)) {
                    content = content.replace(new RegExp(key, 'g'), global.cache.hashes[key].path);
                }
            });
            switch (extname(file)) {
                case '.html':
                case '.htm': {
                    const rel_file = to_relative_path(file);
                    // insert critical css
                    if (file_critical_map[rel_file]) {
                        content = content.replace(
                            '</head>',
                            `<style id="critical">${
                                global.cache.critical[file_critical_map[rel_file]]?.css
                            }</style></head>`
                        );
                    }
                    try {
                        const minified_content = minify(content, {
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
                            from: undefined,
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
