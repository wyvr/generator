import * as fse from 'fs-extra';
import fs from 'fs';
import { join } from 'path';
import { Logger } from '@lib/logger';
import { File } from '@lib/file';

export class Dependency {
    static cache: any = null;
    static new_cache() {
        return {
            doc: {},
            layout: {},
            page: {},
        };
    }
    static build(folders: string[]) {
        if (!folders || folders.length == 0) {
            return null;
        }
        this.cache = this.new_cache();
        const raw_folder = join(process.cwd(), 'gen', 'raw');
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
                            Logger.warning('unknown dependency type', folder);
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
