import { ReleasePath } from '../../vars/release_path.js';
import { write } from '../file.js';

import { STORAGE_OPTIMIZE_HASHES } from '../../constants/storage.js';
import { KeyValue } from '../database/key_value.js';

const hashes_db = new KeyValue(STORAGE_OPTIMIZE_HASHES);

export async function optimize_js(content, rel_path) {
    const file_hash = hashes_db.get(rel_path);
    if (!file_hash) {
        return;
    }
    write(ReleasePath.get(file_hash.path), content);
}
