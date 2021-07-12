import { mkdirSync, existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'fs';
import { extname } from 'path';

import { dirname, join } from 'path';
import { WyvrFile } from '@lib/model/wyvr/file';
import { stringify } from 'flatted';

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
    /**
     * read the content of an file as json
     * @param filename
     * @returns the data of the file
     */
    static read_json(filename: string): any {
        const content = this.read_file(filename);
        if (!content) {
            return null;
        }
        let data = null;
        try {
            data = JSON.parse(content);
        } catch (e) {
            console.log('error reading json from', filename, e);
            return null;
        }
        return data;
    }
    /**
     * read the content of an file as plain text
     * @param filename
     * @returns the content of the file
     */
    static read_file(filename: string): any {
        if (!filename || !existsSync(filename)) {
            return null;
        }
        const content = readFileSync(filename, { encoding: 'utf8', flag: 'r' });
        if (!content) {
            return null;
        }
        return content;
    }
    /**
     * write a json file
     * @param filename
     * @returns void
     */
    static write_json(filename: string, data: any = null): void {
        if (!filename) {
            return;
        }
        // create containing folder
        mkdirSync(dirname(filename), { recursive: true });
        writeFileSync(filename, JSON.stringify(data, null, process.env.WYVR_ENV == 'prod' ? undefined : 4));
    }
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
            dir = join(process.cwd(), 'src');
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
    static is_file(path: string): boolean {
        if (!path || typeof path != 'string') {
            return false;
        }
        const stat = statSync(path);
        return !stat.isDirectory();
    }
}
