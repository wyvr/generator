import { filled_array, match_interface } from './validate.js';
import { createHash as cryptoCreateHash } from 'crypto';
import { exists, read } from './file.js';
import { to_relative_path } from './to.js';
import { extname } from 'path';

export function css_hash(data) {
    if (!match_interface(data, { hash: true, css: true, name: true, filename: true })) {
        return 'wyvr';
    }
    return `wyvr-${data.hash(data.css)}`;
}
export function create_hash(value) {
    if (!value) {
        return '';
    }
    const hash = cryptoCreateHash('sha256');
    hash.update(value);
    return hash.digest('hex').substring(0, 8);
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
        const hash = create_hash(read(file));
        const ext = extname(file);
        result[rel_path] = {
            hash,
            rel_path,
            path: rel_path.replace(ext, `_${hash}${ext}`),
        };
    });
    return result;
}
