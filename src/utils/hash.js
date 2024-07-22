import { filled_array, is_number } from './validate.js';
import { createHash } from 'node:crypto';
import { exists, read } from './file.js';
import { to_relative_path } from './to.js';
import { extname } from 'node:path';
import { statSync } from 'node:fs';
import { ReleasePath } from '../vars/release_path.js';

/**
 * Creates a hash value for the given input value using the SHA256 algorithm.
 * @param {string} value - The input value to be hashed.
 * @param {number} [length=16] - The length of the hash value to be returned. Defaults to 16.
 * @returns {string} The hash value.
 */
export function create_hash(value, length = 16) {
    if (!value) {
        return '0x0';
    }
    const hash = createHash('sha256');
    hash.update(value);
    const len = is_number(length) ? length : 16;
    return hash.digest('hex').substring(0, len);
}

/**
 * Calculates the hashes of the given files and returns an object containing the file paths, hashes, and modified paths.
 *
 * @param {string[]} files - An array of file paths.
 * @returns {Object} - An object containing the file paths, hashes, and modified paths.
 */
export function get_files_hashes(files) {
    const result = {};
    if (!filled_array(files)) {
        return result;
    }
    for (const file of files) {
        if (!exists(file)) {
            continue;
        }
        const hash = get_file_hash(file);
        const rel_path = file.replace(ReleasePath.get(), '');
        const ext = extname(rel_path);
        result[rel_path] = {
            hash,
            rel_path,
            path: rel_path.replace(ext, `_${hash}${ext}`),
        };
    }
    return result;
}

/**
 * Calculates the hash of a file.
 *
 * @param {string} file - The path of the file.
 * @returns {string|undefined} The hash of the file, or undefined if the file doesn't exist.
 */
export function get_file_hash(file) {
    if (!exists(file)) {
        return undefined;
    }
    return create_hash(read(file));
}

/**
 * Calculates the time-based hash value for a given file.
 *
 * @param {string} file - The path of the file.
 * @returns {string|undefined} The time-based hash value of the file, or undefined if the file doesn't exist.
 */
export function get_file_time_hash(file) {
    if (!exists(file)) {
        return undefined;
    }
    const stats = statSync(file);
    return Math.round(stats.mtimeMs * 1000).toString();
}
