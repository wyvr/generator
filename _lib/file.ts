import { mkdirSync, existsSync, readFileSync, readdirSync, statSync, writeFileSync, unlinkSync } from 'fs';
import { extname, dirname, join } from 'path';
import circular from 'circular';
import { WyvrFile } from '@lib/model/wyvr/file';
import { Env } from '@lib/env';
import { Cwd } from '@lib/vars/cwd';
import { Logger } from '@lib/logger';
import { Error } from '@lib/error';

export class File {
    /**
     * converts the given filename to the filename with the given extension
     * @param filename
     * @param extension
     * @returns filename with the given extension
     */
    static to_extension(filename: string, extension: string): string {
        if (!filename || typeof filename != 'string') {
            return '';
        }
        // avoid wrong types of extension
        if (typeof extension != 'string') {
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
    //
    /**
     * create the directory to contain a specific file
     * @param filename
     */
    static create_dir(filename: string): void {
        const dir_path = dirname(filename);
        mkdirSync(dir_path, { recursive: true });
    }
    /**
     * adds the path part index.html to the filename when it is a folder
     * @param filename
     * @param extension
     * @returns filename
     */
    static to_index(filename: string, extension: string = null): string {
        if (!extension) {
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
    static remove_index(filename: string): string {
        if (!filename) {
            return '';
        }
        return filename.replace(/index\.[^.]+/, '');
    }
    /**
     * read the content of an file as json
     * @param filename
     * @returns the data of the file
     */
    /* eslint-disable @typescript-eslint/no-explicit-any*/
    static read_json(filename: string): any {
        const content = this.read(filename);
        if (!content) {
            return undefined;
        }
        let data = undefined;
        try {
            data = JSON.parse(<string>content);
        } catch (e) {
            Logger.error(Error.get(e, filename, 'read json'));
            return undefined;
        }
        return data;
    }
    /* eslint-enable @typescript-eslint/no-explicit-any*/

    /**
     * read the content of an file as plain text
     * @param filename
     * @returns the content of the file
     */
    static read_buffer(filename: string): Buffer {
        return <Buffer>this.read_raw(filename, 'buffer');
    }
    /**
     * read the content of an file as plain text
     * @param filename
     * @returns the content of the file
     */
    static read_raw(filename: string, encoding = 'utf-8'): string | Buffer {
        if (!filename || !existsSync(filename)) {
            return null;
        }
        if (encoding == 'buffer') {
            encoding = null;
        }
        /* eslint-disable @typescript-eslint/no-explicit-any*/
        const content = readFileSync(filename, { encoding: <any>encoding, flag: 'r' });
        /* eslint-enable @typescript-eslint/no-explicit-any*/

        if (!content) {
            return null;
        }
        return content;
    }
    /**
     * read the content of an file as plain text
     * @param filename
     * @returns the content of the file
     */
    static read(filename: string): string {
        return <string>this.read_raw(filename, 'utf-8');
    }
    /**
     * write a file
     * @param filename
     * @returns void
     */
    static write(filename: string, content: string | NodeJS.ArrayBufferView = ''): boolean {
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
    /* eslint-disable @typescript-eslint/no-explicit-any*/
    static write_json(filename: string, data: any = null, check_circular = true): boolean {
        if (!filename) {
            return false;
        }
        const spaces = Env.json_spaces(process.env);

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
    /* eslint-enable @typescript-eslint/no-explicit-any*/
    /**
     * search for one file out of multiple possible files, to depict hierachy of file overrides
     * @param in_dir root directory to search in
     * @param possible_files
     * @returns path of the found file
     */
    static find_file(in_dir: string, possible_files: string[]): string {
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
    static collect_svelte_files(dir: string = null) {
        if (!dir) {
            dir = join(Cwd.get(), 'src');
        }
        const result = this.collect_files(dir, 'svelte').map((path) => new WyvrFile(path));
        return result;
    }
    /**
     * performs a recursive search in the given dir to find all files with the given extension or all files
     * @param dir root directory to search in
     * @param extension optional extension
     * @returns list of the paths
     */
    static collect_files(dir: string, extension: string = null): string[] {
        if (!dir || !existsSync(dir)) {
            return [];
        }
        const entries = readdirSync(dir);
        const result = [];
        let regex = /./;
        if (extension && typeof extension == 'string') {
            /* eslint-disable no-useless-escape */
            // escaping is here not useless
            regex = new RegExp(`\.${extension}$`);
            /* eslint-enable */
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
    static is_file(path: string): boolean {
        if (!path || typeof path != 'string' || !existsSync(path)) {
            return false;
        }
        const stat = statSync(path);
        return !stat.isDirectory();
    }

    static get_folder(folder: string): { name: string; path: string }[] {
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

    static remove(file: string): boolean {
        if (existsSync(file)) {
            unlinkSync(file);
            return true;
        }
        return false;
    }
}