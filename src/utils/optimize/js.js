import { ReleasePath } from '../../vars/release_path.js';
import { exists, write } from '../file.js';

import { STORAGE_OPTIMIZE_HASHES } from '../../constants/storage.js';
import { KeyValue } from '../database/key_value.js';
import { get_content_hash_entry } from '../hash.js';
import { Logger } from '../logger.js';
import { get_error_message } from '../error.js';
import { filled_string } from '../validate.js';
import { replace_files_with_content_hash } from '../optimize.js';

const hashes_db = new KeyValue(STORAGE_OPTIMIZE_HASHES);

export async function optimize_js(content, rel_path) {
    if (!filled_string(content) || !filled_string(rel_path)) {
        return;
    }
    try {
        let file_hash = hashes_db.get(rel_path);
        let file_content = content;
        if (!file_hash) {
            file_content = replace_files_with_content_hash(content);
            const entry = get_content_hash_entry(
                file_content,
                ReleasePath.get(rel_path)
            );
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
        write(target, file_content);
    } catch (e) {
        Logger.error(get_error_message(e, rel_path, 'js'));
    }
}
