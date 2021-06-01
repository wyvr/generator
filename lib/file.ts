import * as fs from 'fs';
import * as fse from 'fs-extra';

import { dirname, join } from 'path';
import { HydrateFileEntry } from '@lib/model/wyvr/hydrate';

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
        const found = possible_files.find((file) => {
            return fs.existsSync(join(in_dir, file));
        });
        if (!found) {
            return null;
        }
        return join(in_dir, found);
    }
    static get_hydrateable_svelte_files(dir: string = null): HydrateFileEntry[] {
        if (!dir) {
            dir = join(process.cwd(), 'src');
        }
        const entries = fs.readdirSync(dir);
        const result = [];
        entries.forEach((entry) => {
            const path = join(dir, entry);
            const stat = fs.statSync(path);
            if (stat.isDirectory()) {
                result.push(...this.get_hydrateable_svelte_files(path));
                return;
            }
            if (stat.isFile() && entry.match(/\.svelte$/)) {
                const content = fs.readFileSync(path, { encoding: 'utf-8' });
                const match = content.match(/wyvr:\s+(\{[^}]+\})/);
                if (match) {
                    let config = null;
                    try {
                        config = {};
                        match[1].split('\n').forEach((row) => {
                            const cfg_string = row.match(/(\w+): '(\w+)'/);
                            if (cfg_string) {
                                config[cfg_string[1]] = cfg_string[2];
                                return;
                            }
                            const cfg_bool = row.match(/(\w+): (true|false)/);
                            if (cfg_bool) {
                                config[cfg_bool[1]] = cfg_bool[2] === 'true';
                                return;
                            }
                            const cfg_number = row.match(/(\w+): (\d+)/);
                            if (cfg_number) {
                                config[cfg_number[1]] = parseFloat(cfg_number[2]);
                                return;
                            }
                        });
                    } catch (e) {
                        config = { error: e };
                    }
                    result.push({
                        path,
                        config,
                    });
                }
                return;
            }
        });

        return result;
    }
    static transform_hydrateable_svelte_files(files: HydrateFileEntry[]) {
        return files.map((entry) => entry);
    }
}
