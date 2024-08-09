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
import { uniq_values } from '../uniq.js';

const hashes_db = new KeyValue(STORAGE_OPTIMIZE_HASHES);

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
            cssnano({ plugins: [autoprefixer] }),
        ]).process(content, {
            from: undefined,
        });
        // remove duplicated code in the files
        const css = result.css.split('\n').filter((line) => line.trim() !== '');
        write(target, uniq_values(css).join('\n'));
    } catch (e) {
        Logger.error(get_error_message(e, file, 'css'));
    }
}
