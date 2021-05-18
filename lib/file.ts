import * as fs from 'fs-extra';

import { dirname } from 'path';

export class File {
    /**
     * converts the given filename to the filename with the given extension
     * @param filename 
     * @param extension 
     * @returns filename with the given extension
     */
    static to_extension(filename:string, extension:string): string {
        if (!filename || typeof filename != 'string' || !extension || typeof extension != 'string') {
            return '';
        }
        const splitted = filename.split('.');
        if (splitted.length <= 1) {
            return filename;
        }
        // remove last element => extension
        splitted.pop();
        extension.trim();
        if (extension.indexOf('.') == 0) {
            extension = extension.replace(/^\./, '');
        }
        return [...splitted, extension].join('.');
    }
    // 
    /**
     * create the directory to contain a specific file
     * @param filename 
     */
    static create_dir(filename: string):void {
        const dir_path = dirname(filename);
        fs.mkdirSync(dir_path, { recursive: true });
    }
    /**
     * adds the path part index.html to the filename when it is a folder
     * @param {string} filename
     * @param {string} extension
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
}
