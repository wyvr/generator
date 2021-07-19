import { readdirSync, existsSync, readFileSync } from 'fs';
import { join, extname, dirname, resolve } from 'path';
import { Logger } from '@lib/logger';
import { File } from '@lib/file';

export class Dependency {
    static cache: any = null;
    static new_cache() {
        return {};
    }
    static build(source_folder: string) {
        if (!existsSync(source_folder)) {
            return null;
        }
        // add minimum structure to clear cache
        this.cache = this.prepare(this.new_cache());
        // will contain all files that where found inside the given folder
        const all_files = File.collect_svelte_files(source_folder).map((file) => file.path);

        File.get_folder(source_folder).forEach((folder) => {
            all_files
                .filter((file_path: string) => {
                    return file_path.indexOf(folder.path) > -1;
                })
                .forEach((file_path: string) => {
                    const content = File.read_file(file_path);
                    if (content) {
                        this.extract_from_content(folder.name, file_path.replace(source_folder + '/', ''), content);
                    }
                });
        });
        // console.log(this.cache);
        return all_files;
    }

    static extract_from_content(root: string, parent: string, content: string) {
        if (!root || !parent || !content) {
            return;
        }
        const matches = [...content.matchAll(/import (.*?) from ['"](?:@src\/)?([^'"]*)['"]/g)];
        // ensure that cache is available
        if (!this.cache) {
            this.cache = this.new_cache();
        }
        if (matches && matches.length > 0) {
            matches.forEach((match) => {
                // when no extension is used, it must be js
                let file = match[2];
                if (!extname(file)) {
                    file += '.js';
                }
                // fix path of file, when relative
                if (file.indexOf('./') == 0 || file.indexOf('../') == 0) {
                    file = join(dirname(parent), file);
                }
                // add root when not existing
                if (!this.cache[root]) {
                    this.cache[root] = {};
                }
                // add parent in root when not existing
                if (!this.cache[root][parent]) {
                    this.cache[root][parent] = [];
                }
                // add file to parent
                this.cache[root][parent].push(file);
            });
        }
    }

    static prepare(cache: any): any {
        // when the structure is not correct create new cache
        if (!cache || typeof cache != 'object' || Array.isArray(cache)) {
            cache = this.new_cache();
        }
        // ensure that the base elements are available
        if (!cache.doc) {
            cache.doc = {};
        }
        if (!cache.layout) {
            cache.layout = {};
        }
        if (!cache.page) {
            cache.page = {};
        }
        return cache;
    }
}
