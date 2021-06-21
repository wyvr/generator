import * as fs from 'fs';

import { dirname, join } from 'path';
import { WyvrFile } from '@lib/model/wyvr/file';

export class File {
    /**
     * converts the given filename to the filename with the given extension
     * @param filename
     * @param extension
     * @returns filename with the given extension
     */
    static to_extension(filename: string, extension: string): string {
        if (!filename || typeof filename != 'string' || !extension || typeof extension != 'string') {
            return '';
        }
        extension.trim();
        if (extension.indexOf('.') == 0) {
            extension = extension.replace(/^\./, '');
        }
        const splitted = filename.split('.');
        if (splitted.length <= 1) {
            return `${filename}.${extension}`;
        }
        // remove last element => extension
        splitted.pop();
        return [...splitted, extension].join('.');
    }
    //
    /**
     * create the directory to contain a specific file
     * @param filename
     */
    static create_dir(filename: string): void {
        const dir_path = dirname(filename);
        fs.mkdirSync(dir_path, { recursive: true });
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
        return filename;
    }
    /**
     * read the content of an file as json
     * @param filename
     * @returns the data of the file
     */
    static read_json(filename: string): any {
        if (!filename || !fs.existsSync(filename)) {
            return null;
        }
        const content = fs.readFileSync(filename, { encoding: 'utf8', flag: 'r' });
        if (!content) {
            return null;
        }
        let data = null;
        try {
            data = JSON.parse(content);
        } catch (e) {
            console.log(e);
            return null;
        }
        return data;
    }
    static find_file(in_dir: string, possible_files: string[]) {
        if (!possible_files || !Array.isArray(possible_files) || possible_files.length == 0) {
            return null;
        }
        const found = possible_files.find((file) => {
            return fs.existsSync(join(in_dir, file));
        });
        if (!found) {
            return null;
        }
        return join(in_dir, found);
    }
    static collect_svelte_files(dir: string = null) {
        if (!dir) {
            dir = join(process.cwd(), 'src');
        }
        const result = this.collect_files(dir, 'svelte').map((path) => new WyvrFile(path));
        return result;
    }
    static collect_files(dir: string, extension: string = null) {
        if (!dir || !fs.existsSync(dir)) {
            return [];
        }
        const entries = fs.readdirSync(dir);
        const result = [];
        let regex = /./;
        if (extension) {
            regex = new RegExp(`\.${extension}$`);
        }
        entries.forEach((entry) => {
            const path = join(dir, entry);
            const stat = fs.statSync(path);
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
}
