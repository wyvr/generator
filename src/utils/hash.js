import { filled_array } from './validate.js';
import { createHash as cryptoCreateHash } from 'crypto';
import { exists, read } from './file.js';
import { to_relative_path } from './to.js';
import { extname } from 'path';
import { statSync } from 'fs';

export function create_hash(value, length) {
    if (!value) {
        return '0x0';
    }
    const hash = cryptoCreateHash('sha256');
    hash.update(value);
    return hash.digest('hex').substring(0, !isNaN(length) ? length : 16);
}
export function get_files_hashes(files) {
    const result = {};
    if (!filled_array(files)) {
        return result;
    }
    files.forEach((file) => {
        if (!exists(file)) {
            return;
        }
        const rel_path = to_relative_path(file);
        const hash = get_file_hash(file);
        const ext = extname(file);
        result[rel_path] = {
            hash,
            rel_path,
            path: rel_path.replace(ext, `_${hash}${ext}`),
        };
    });
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
