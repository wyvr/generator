import { mkdirSync, existsSync, readFileSync, readdirSync, statSync, writeFileSync, unlinkSync } from 'fs';
import { extname, dirname, join } from 'path';
import circular from 'circular';
import { is_string, filled_string } from './validate.js';

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
    if (extension.indexOf('.') == 0) {
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
export function to_index(filename, extension = null) {
    if (!filled_string(extension)) {
        extension = 'html';
    }
    const ext = extension.trim().replace(/^\./, '');

    if (!filename || typeof filename != 'string' || !filename.trim()) {
        return `index.${ext}`;
    }
    const parts = filename.split('/');
    const last = parts[parts.length - 1];
    if (last === '') {
        parts[parts.length - 1] = `index.${ext}`;
        return parts.join('/');
    }
    if (last.indexOf('.') == -1) {
        parts.push(`index.${ext}`);
        return parts.join('/');
    }
    // dotfiles
    if (last.indexOf('.') == 0) {
        parts[parts.length - 1] = `${last}.${ext}`;
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
    return filename.replace(/index\.[^.]+/, '');
}
/**
 * read the content of an file as plain text
 * @param filename
 * @returns the content of the file
 */
export function read_raw(filename, encoding = 'utf-8') {
    if (!is_string(filename) || !existsSync(filename)) {
        return undefined;
    }
    if (encoding == 'buffer') {
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
export function write(filename, content = '') {
    if (!filename) {
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
export function write_json(filename, data = null, check_circular = true) {
    if (!filename) {
        return false;
    }
    const spaces = undefined; //Env.json_spaces(process.env);

    // @see https://dev.to/madhunimmo/json-stringify-rangeerror-invalid-string-length-3977
    if (Array.isArray(data)) {
        // create containing folder
        mkdirSync(dirname(filename), { recursive: true });
        // arrays can be inserted per entry, to avoid overflow
        const len = data.length;
        writeFileSync(filename, '[', { flag: 'a' });
        for (let i = 0; i < len; i++) {
            writeFileSync(
                filename,
                JSON.stringify(data[i], check_circular ? circular() : null, spaces) + (i + 1 < len ? ',' : ''),
                { flag: 'a' }
            );
        }
        writeFileSync(filename, ']', { flag: 'a' });
        return;
    }

    return this.write(filename, JSON.stringify(data, check_circular ? circular() : null, spaces));
}
/**
 * search for one file out of multiple possible files, to depict hierachy of file overrides
 * @param in_dir root directory to search in
 * @param possible_files
 * @returns path of the found file
 */
export function find_file(in_dir, possible_files) {
    if (!possible_files || !Array.isArray(possible_files) || possible_files.length == 0) {
        return null;
    }
    const found = possible_files.find((file) => {
        if (!file) {
            return false;
        }
        return existsSync(join(in_dir, file));
    });
    if (!found) {
        return null;
    }
    return join(in_dir, found);
}
/**
 * performs a recursive search in the given dir to find all svelte files
 * @param dir root directory to search in
 * @returns list of the paths
 */
export function collect_svelte_files(dir) {
    if (!dir) {
        dir = ''; //join(Cwd.get(), 'src');
    }
    //const result = this.collect_files(dir, 'svelte').map((path) => new WyvrFile(path));
    //return result;
    return [];
}
/**
 * performs a recursive search in the given dir to find all files with the given extension or all files
 * @param dir root directory to search in
 * @param extension optional extension
 * @returns list of the paths
 */
export function collect_files(dir, extension = null) {
    if (!dir || !existsSync(dir)) {
        return [];
    }
    const entries = readdirSync(dir);
    const result = [];
    let regex = /./;
    if (extension && typeof extension == 'string') {
        // escaping is here not useless
        regex = new RegExp(`\.${extension}$`);
    }
    entries.forEach((entry) => {
        const path = join(dir, entry);
        const stat = statSync(path);
        if (stat.isDirectory()) {
            result.push(...this.collect_files(path, extension));
            return;
        }
        if (stat.isFile() && entry.match(regex)) {
            result.push(path);
        }
    });

    return result;
}
/**
 * check if a given path is a file
 * @param path path to a file
 * @returns
 */
export function is_file(path) {
    if (!path || typeof path != 'string' || !existsSync(path)) {
        return false;
    }
    const stat = statSync(path);
    return !stat.isDirectory();
}

export function get_folder(folder) {
    if (!folder || typeof folder != 'string' || !existsSync(folder)) {
        return null;
    }
    return readdirSync(folder)
        .map((entry) => {
            return {
                name: entry,
                path: join(folder, entry),
            };
        })
        .filter((entry) => {
            return !this.is_file(entry.path);
        });
}

export function remove(file) {
    if (existsSync(file)) {
        unlinkSync(file);
        return true;
    }
    return false;
}