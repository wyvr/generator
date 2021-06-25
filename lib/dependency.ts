import * as fse from 'fs-extra';
import fs from 'fs';
import { join } from 'path';
import { Logger } from '@lib/logger';
import { File } from '@lib/file';

export class Dependency {
    static cache: any = null;
    static new_cache() {
        return {};
    }
    // static get_list() {
    //     if (!this.cache) {
    //         return [];
    //     }
    //     const list = [];
    //     Object.keys(this.cache).map((key) => {
    //         Object.keys(this.cache[key]).forEach((parent_file) => {
    //             list.push(parent_file);
    //             list.push(...this.cache[key][parent_file]);
    //         });
    //     });
    //     return list;
    // }
    static build() {
        this.cache = this.new_cache();
        const raw_folder = join(process.cwd(), 'gen', 'raw');
        const folders = fs.readdirSync(raw_folder).filter((entry) => {
            return !File.is_file(join(raw_folder, entry));
        });
        const folder_files = folders.map((folder) => {
            const folder_path = join(raw_folder, folder);
            if (!fs.existsSync(folder_path)) {
                Logger.warning('can not build dependencies', folder, 'does not exist');
                return null;
            }
            const files = File.collect_svelte_files(folder_path)
                .map((file) => file.path)
                .filter((x) => x);

            files.forEach((filepath: string) => {
                //
                const content = fs.readFileSync(filepath, { encoding: 'utf-8' });
                const matches = [...content.matchAll(/import (.*?) from ['"]@src\/([^'"]*)['"]/g)];
                if (matches && matches.length > 0) {
                    const parent = filepath.replace(raw_folder + '/', '');
                    matches.forEach((match) => {
                        if (!this.cache[folder]) {
                            this.cache[folder] = {};
                        }
                        if (!this.cache[folder][parent]) {
                            this.cache[folder][parent] = [];
                        }
                        this.cache[folder][parent].push(match[2]);
                    });
                }
            });

            return files;
        });
        return [].concat(...folder_files).filter((x) => x);
    }
}
