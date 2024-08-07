import {
    mkdirSync,
    existsSync,
    readFileSync,
    readdirSync,
    statSync,
    writeFileSync,
    copyFileSync,
    rmSync,
    symlinkSync,
    lstatSync,
    appendFileSync,
    renameSync,
} from 'node:fs';
import { extname, dirname, join } from 'node:path';
import { stringify } from './json.js';
import { is_string, filled_string, filled_array } from './validate.js';
import { WyvrFile } from '../model/wyvr_file.js';
import { Env } from '../vars/env.js';
import { Logger } from './logger.js';

/**
 * converts the given filename to the filename with the given extension
 * @param filename
 * @param extension
 * @returns filename with the given extension
 */
export function to_extension(filename, extension) {
    if (!is_string(filename)) {
        return '';
    }
    // avoid wrong types of extension
    if (!is_string(extension)) {
        return filename;
    }
    // create new extension
    extension.trim();
    if (extension.indexOf('.') === 0) {
        extension = extension.replace(/^\./, '');
    }
    // only add dot when something is set
    if (extension) {
        extension = `.${extension}`;
    }
    // remove old extension
    const ext = extname(filename);
    if (ext) {
        const regex = new RegExp(`${ext.replace(/^\./, '\\.')}$`);
        return filename.replace(regex, extension);
    }
    // append to dotfiles or to folders
    return filename + extension;
}

/**
 * adds the path part index.html to the filename when it is a folder
 * @param filename
 * @param extension
 * @returns filename
 */
export function to_index(filename, extension) {
    let had_empty_ext = false;
    if (!filled_string(extension)) {
        had_empty_ext = true;
        extension = 'html';
    }
    const ext = extension.trim().replace(/^\./, '');

    if (!filename || typeof filename !== 'string' || !filename.trim()) {
        return `index.${ext}`;
    }
    const parts = filename.split('/');
    const last = parts[parts.length - 1];
    if (last === '') {
        parts[parts.length - 1] = `index.${ext}`;
        return parts.join('/');
    }
    if (last === 'index') {
        parts[parts.length - 1] = `index.${ext}`;
        return parts.join('/');
    }
    if (last.indexOf('.') === -1) {
        parts.push(`index.${ext}`);
        return parts.join('/');
    }
    // dotfiles
    if (last.indexOf('.') === 0) {
        parts[parts.length - 1] = had_empty_ext ? last : `${last}.${ext}`;
        return parts.join('/');
    }
    return filename;
}

/**
 * create the directory to contain a specific file
 * @param filename
 */
export function create_dir(filename) {
    if (!is_string(filename)) {
        return;
    }
    const dir_path = dirname(filename);
    mkdirSync(dir_path, { recursive: true });
}

export function remove_index(filename) {
    if (!is_string(filename)) {
        return '';
    }
    const without = filename.replace(/index\.[^.]+/, '');
    if (without === '/') {
        return without;
    }
    return without.replace(/\/$/, '');
}
/**
 * read the content of an file as plain text
 * @param filename
 * @returns the content of the file
 */
export function read_raw(filename, encoding = 'utf-8') {
    if (!exists(filename)) {
        return undefined;
    }
    if (encoding === 'buffer') {
        encoding = undefined;
    }
    const content = readFileSync(filename, { encoding, flag: 'r' });

    if (!content) {
        return undefined;
    }
    return content;
}
/**
 * read the content of an file as plain text
 * @param filename
 * @returns the content of the file
 */
export function read_buffer(filename) {
    return read_raw(filename, 'buffer');
}

/**
 * read the content of an file as plain text
 * @param filename
 * @returns the content of the file
 */
export function read(filename) {
    return read_raw(filename, 'utf-8');
}
/**
 * read the content of an file as json
 * @param filename
 * @returns the data of the file
 */
export function read_json(filename) {
    const content = read(filename);
    if (!content) {
        return undefined;
    }
    let data;
    try {
        data = JSON.parse(content);
    } catch (e) {
        //    Logger.error(Error.get(e, filename, 'read json'));
        return undefined;
    }
    return data;
}

/**
 * write a file
 * @param filename
 * @returns void
 */
export function write(filename, content) {
    if (
        !is_string(filename) ||
        (!is_string(content) && !Buffer.isBuffer(content))
    ) {
        return false;
    }
    // create containing folder
    mkdirSync(dirname(filename), { recursive: true });
    writeFileSync(filename, content);
    return true;
}
/**
 * write a json file
 * @param filename
 * @returns void
 */
export function write_json(filename, data = null) {
    if (!is_string(filename)) {
        return false;
    }
    const spaces = Env.json_spaces();

    // @see https://dev.to/madhunimmo/json-stringify-rangeerror-invalid-string-length-3977
    if (filled_array(data)) {
        // create containing folder
        mkdirSync(dirname(filename), { recursive: true });
        // arrays can be inserted per entry, to avoid overflow
        const len = data.length;
        writeFileSync(filename, Env.is_dev() ? '[\n' : '[', { flag: 'w+' });
        const seperator = Env.is_dev() ? ',\n' : ',';
        for (let i = 0; i < len; i++) {
            const content =
                stringify(data[i], spaces) + (i + 1 < len ? seperator : '');
            writeFileSync(filename, content, {
                flag: 'a',
            });
        }
        writeFileSync(filename, Env.is_dev() ? '\n]' : ']', { flag: 'a' });
        return true;
    }

    return write(filename, stringify(data, spaces));
}
/**
 * append the content to the file
 * @param {string} filename
 * @param {string} content
 * @returns {boolean}
 */
export function append(filename, content) {
    if (!is_string(filename) || !is_string(content)) {
        return false;
    }
    mkdirSync(dirname(filename), { recursive: true });
    appendFileSync(filename, content);
    return true;
}
/**
 * search for one file out of multiple possible files, to depict hierachy of file overrides
 * @param in_dir root directory to search in
 * @param possible_files
 * @returns path of the found file
 */
export function find_file(in_dir, possible_files) {
    if (
        !possible_files ||
        !Array.isArray(possible_files) ||
        possible_files.length == 0
    ) {
        return undefined;
    }
    const found = possible_files.find((file) => {
        if (!file) {
            return false;
        }
        return exists(join(in_dir, file));
    });
    if (!found) {
        return undefined;
    }
    return join(in_dir, found);
}

/**
 * performs a recursive search in the given dir to find all files with the given extension or all files
 * @param dir root directory to search in
 * @param extension optional extension
 * @returns list of the paths
 */
export function collect_files(dir, extension, forbidden_folder) {
    if (!exists(dir)) {
        return [];
    }
    const entries = readdirSync(dir);
    const result = [];
    let regex = /.*/;
    if (filled_string(extension)) {
        // escaping is here not useless
        regex = new RegExp(`\\.${extension.trim().replace(/^\./, '')}$`);
    }
    for (const entry of entries) {
        const path = join(dir, entry);
        let stat;
        try {
            stat = statSync(path);
        } catch (e) {
            continue;
        }
        if (!stat) {
            continue;
        }
        if (
            Array.isArray(forbidden_folder) &&
            forbidden_folder.indexOf(entry) > -1
        ) {
            continue;
        }
        if (stat.isDirectory()) {
            result.push(...collect_files(path, extension));
            continue;
        }
        if (stat.isFile() && entry.match(regex)) {
            result.push(path);
        }
    }

    return result;
}
/**
 * performs a recursive search in the given dir to find all svelte files
 * @param dir root directory to search in
 * @returns list of the paths
 */
export function collect_svelte_files(dir) {
    if (!filled_string(dir)) {
        return [];
    }
    const result = collect_files(dir, 'svelte').map((path) => WyvrFile(path));
    return result;
}
/**
 * check if a given path exists
 * @param path path to a file
 * @returns {boolean}
 */
export function exists(path) {
    if (!path || typeof path !== 'string' || !existsSync(path)) {
        return false;
    }
    return true;
}
/**
 * check if a given path is a file
 * @param path path to a file
 * @returns
 */
export function is_file(path) {
    if (!exists(path)) {
        return false;
    }
    return !is_dir(path);
}
/**
 * check if a given path is a directory
 * @param path path to a directory
 * @returns
 */
export function is_dir(path) {
    if (!exists(path)) {
        return false;
    }
    return statSync(path).isDirectory();
}

export function get_folder(folder) {
    if (!exists(folder)) {
        return undefined;
    }
    return readdirSync(folder)
        .map((entry) => {
            return {
                name: entry,
                path: join(folder, entry),
            };
        })
        .filter((entry) => {
            return !is_file(entry.path);
        });
}

export function remove(file) {
    if (!exists(file)) {
        return false;
    }
    rmSync(file, { recursive: true, force: true });
    return true;
}

export function symlink(from, to) {
    if (exists(from) && filled_string(to)) {
        /* c8 ignore start */
        try {
            create_dir(to);
            if (exists(to)) {
                const is_symlink = lstatSync(to).isSymbolicLink();
                if (!is_symlink) {
                    Logger.error(
                        'symlink',
                        from,
                        to,
                        'to is a regular file no symlink'
                    );
                    return false;
                }
            }
            // force removing the to
            rmSync(to, { recursive: true, force: true });
            symlinkSync(from, to);
        } catch (e) {
            Logger.error('symlink', from, to, e);
            return false;
        }
        return true;
        /* c8 ignore stop */
    }
    return false;
}

export function copy(from, to) {
    if (!exists(from) || !filled_string(to)) {
        return false;
    }
    try {
        create_dir(to);
        copyFileSync(from, to);
        return true;
    } catch (e) {
        Logger.error('copy', from, to, e);
        return false;
    }
}

/**
 * Renames a file, the new name will be in the same directory
 * @param {string} file
 * @param {string} new_name
 * @returns
 */
export function rename(file, new_name) {
    if (!filled_string(file) || !filled_string(new_name) || !exists(file)) {
        return false;
    }
    const new_file = join(dirname(file), new_name);
    renameSync(file, new_file);
    return true;
}
