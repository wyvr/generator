import { ReleasePath } from '../../vars/release_path.js';
import { get_error_message } from '../error.js';
import { exists, write } from '../file.js';
import { Logger } from '../logger.js';

import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import { STORAGE_OPTIMIZE_HASHES } from '../../constants/storage.js';
import { KeyValue } from '../database/key_value.js';
import { get_file_hash_entry } from '../hash.js';

const hashes_db = new KeyValue(STORAGE_OPTIMIZE_HASHES);
/**
 * Optimize the css content and store the file hash
 * @param {string} content
 * @param {string} rel_path
 */
export async function optimize_css(content, rel_path) {
    try {
        let file_hash = hashes_db.get(rel_path);
        if (!file_hash) {
            const entry = get_file_hash_entry(ReleasePath.get(rel_path));
            if (!entry) {
                return;
            }
            const db_result = hashes_db.set(rel_path, entry);
            file_hash = entry;
        }
        const target = ReleasePath.get(file_hash.path);
        if (exists(target)) {
            return;
        }
        const result = await postcss([
            autoprefixer,
            cssnano({ preset: 'default' }),
        ]).process(content, {
            from: undefined,
        });
        write(target, result.css);
    } catch (e) {
        Logger.error(get_error_message(e, rel_path, 'css'));
    }
}
