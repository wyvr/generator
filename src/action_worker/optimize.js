import { filled_array } from '../utils/validate.js';
import { read, write } from '../utils/file.js';
import { Logger } from '../utils/logger.js';
import { extname, join } from 'node:path';
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import { get_error_message } from '../utils/error.js';
import { ReleasePath } from '../vars/release_path.js';
import { KeyValue } from '../utils/database/key_value.js';
import {
    STORAGE_OPTIMIZE_CRITICAL,
    STORAGE_OPTIMIZE_HASHES,
    STORAGE_OPTIMIZE_MEDIA_QUERY_FILES,
} from '../constants/storage.js';
import { optimize_content } from '../utils/optimize.js';

const hashes_db = new KeyValue(STORAGE_OPTIMIZE_HASHES);
const media_query_files_db = new KeyValue(STORAGE_OPTIMIZE_MEDIA_QUERY_FILES);
const critical_db = new KeyValue(STORAGE_OPTIMIZE_CRITICAL);
export async function optimize(files) {
    if (!filled_array(files)) {
        return false;
    }
    const media_query_files_keys = media_query_files_db.keys();
    const identifiers = critical_db.keys();

    // create map of the critical css and file relation
    const file_critical_map = {};
    for (const identifier of identifiers) {
        const files = critical_db.get(identifier)?.files;
        if (!filled_array(files)) {
            continue;
        }
        for (const file of files) {
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
            for (const css_file of media_query_files_keys) {
                if (content.indexOf(css_file) > -1) {
                    const medias_query_files =
                        media_query_files_db.get(css_file);
                    if (!media_query_files_db) {
                        continue;
                    }
                    for (const media of Object.keys(medias_query_files)) {
                        media_query_links.push(
                            `<link href="${medias_query_files[media]}" rel="stylesheet" media="${media}">`
                        );
                    }
                }
            }
            if (filled_array(media_query_links)) {
                content = content.replace(
                    '</head>',
                    `${media_query_links.join('')}</head>`
                );
            }

            const rel_path = file.replace(ReleasePath.get(), '');

            switch (extname(file)) {
                case '.html':
                case '.htm': {
                    const optimized_content = await optimize_content(
                        content,
                        file_critical_map[rel_path]
                    );
                    write(file, optimized_content);
                    break;
                }
                case '.css': {
                    try {
                        const file_hash = hashes_db.get(rel_path);
                        if (!file_hash) {
                            break;
                        }
                        const result = await postcss([
                            cssnano({ plugins: [autoprefixer] }),
                        ]).process(content, {
                            from: undefined,
                        });
                        write(
                            join(ReleasePath.get(), file_hash.path),
                            result.css
                        );
                    } catch (e) {
                        Logger.error(get_error_message(e, file, 'css'));
                    }
                    break;
                }
                case '.cjs':
                case '.mjs':
                case '.js': {
                    const file_hash = hashes_db.get(rel_path);
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
