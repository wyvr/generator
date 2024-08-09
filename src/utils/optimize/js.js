import { ReleasePath } from '../../vars/release_path.js';
import { exists, write } from '../file.js';

import { STORAGE_OPTIMIZE_HASHES } from '../../constants/storage.js';
import { KeyValue } from '../database/key_value.js';
import { get_file_hash_entry } from '../hash.js';
import { Logger } from '../logger.js';
import { get_error_message } from '../error.js';

const hashes_db = new KeyValue(STORAGE_OPTIMIZE_HASHES);

export async function optimize_js(content, rel_path) {
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
        write(target, content);
    } catch (e) {
        Logger.error(get_error_message(e, rel_path, 'js'));
    }
}
