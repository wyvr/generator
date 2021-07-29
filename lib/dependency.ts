import { readdirSync, existsSync, readFileSync } from 'fs';
import { join, extname, dirname, resolve } from 'path';
import { Logger } from '@lib/logger';
import { File } from '@lib/file';

export class Dependency {
    static cache: any = null;

    static pkg_dep: any = null;
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
    static get_pkg_dependencies() {
        if (this.pkg_dep) {
            return this.pkg_dep;
        }
        const pkg_path = join(process.cwd(), 'package.json');
        if (!existsSync(pkg_path)) {
            return [];
        }
        const pkg = require(pkg_path);
        if (!pkg) {
            return [];
        }
        this.pkg_dep = [];
        if (pkg.dependencies) {
            this.pkg_dep.push(...Object.keys(pkg.dependencies));
        }
        if (pkg.devDependencies) {
            this.pkg_dep.push(...Object.keys(pkg.devDependencies));
        }
        return this.pkg_dep;
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
            matches
                .filter((match) => {
                    // ignore package.json files
                    return this.get_pkg_dependencies().indexOf(match[2]) == -1;
                })
                .forEach((match) => {
                    // when no extension is used, it must be js
                    let file = match[2];
                    if (!extname(file)) {
                        if (existsSync(join(process.cwd(), 'gen', 'src', file + '.ts'))) {
                            file += '.ts';
                        }
                        if (existsSync(join(process.cwd(), 'gen', 'src', file + '.js'))) {
                            file += '.js';
                        }
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
    static get_dependent_identifiers(rel_path: string) {
        const filename = rel_path.replace(/.*?src\//, '');

        const deps = [];
        Object.keys(this.cache).forEach((root) => {
            Object.keys(this.cache[root]).forEach((parent) => {
                if (parent.indexOf(filename) > -1) {
                    if (['doc', 'layout', 'page'].indexOf(root) > -1) {
                        deps.push(parent);
                        return;
                    }
                }
                if (this.cache[root][parent].indexOf(filename) > -1) {
                    deps.push(...this.get_dependent_identifiers(parent));
                }
            });
        });
        return deps;
    }
}
