import { filled_array, is_number } from './validate.js';
import { createHash } from 'node:crypto';
import { exists, read } from './file.js';
import { to_relative_path } from './to.js';
import { extname } from 'node:path';
import { statSync } from 'node:fs';

export function create_hash(value, length = 16) {
    if (!value) {
        return '0x0';
    }
    const hash = createHash('sha256');
    hash.update(value);
    const len = is_number(length) ? length : 16;
    return hash.digest('hex').substring(0, len);
}
export function get_files_hashes(files) {
    const result = {};
    if (!filled_array(files)) {
        return result;
    }
    for (const file of files) {
        if (!exists(file)) {
            continue;
        }
        const rel_path = to_relative_path(file);
        const hash = get_file_hash(file);
        const ext = extname(file);
        result[rel_path] = {
            hash,
            rel_path,
            path: rel_path.replace(ext, `_${hash}${ext}`)
        };
    }
    return result;
}
export function get_file_hash(file) {
    if (!exists(file)) {
        return undefined;
    }
    return create_hash(read(file));
}
export function get_file_time_hash(file) {
    if (!exists(file)) {
        return undefined;
    }
    const stats = statSync(file);
    return Math.round(stats.mtimeMs * 1000).toString();
}
