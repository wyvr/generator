import { readdirSync, existsSync, readFileSync } from 'fs';
import { join, extname, dirname, resolve, sep } from 'path';
import { Logger } from '@lib/logger';
import { File } from '@lib/file';
import { WyvrFile } from '@lib/model/wyvr/file';

export class Dependency {
    static cache: any = null;
    static page_cache: any = {};

    static pkg_dep: any = null;
    static new_cache() {
        return {};
    }
    static build(source_folder: string, build_pages: any[], shortcode_dependencies: any[]) {
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
        // build page cache
        build_pages.forEach((page) => {
            this.page_cache[page.filename] = {
                doc: page.doc.replace(/.*?\/gen\//, ''),
                layout: page.layout.replace(/.*?\/gen\//, ''),
                page: page.page.replace(/.*?\/gen\//, ''),
            };
        });

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
                    // fix path of file, when relative
                    if (file.indexOf('./') == 0 || file.indexOf('../') == 0) {
                        file = join(dirname(parent), file);
                    }
                    // add extension when not supplied
                    if (!extname(file)) {
                        const src_folder = join(process.cwd(), 'gen', 'src');
                        const file_with_ext = ['.ts', '.js']
                            .map((ext) => {
                                if (existsSync(join(src_folder, file + ext))) {
                                    return file + ext;
                                }
                                return null;
                            })
                            .find((x) => x);
                        if (file_with_ext) {
                            file = file_with_ext;
                        }
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

        // console.log('get_dependent_identifiers', deps);
        return deps;
    }
    static get_dependent_pages(deps: string[]) {
        const pages = [];
        // console.log('get_dependent_pages', deps);
        Object.keys(this.page_cache).forEach((key) => {
            if (deps.indexOf(this.page_cache[key].doc) > -1 || deps.indexOf(this.page_cache[key].layout) > -1 || deps.indexOf(this.page_cache[key].page) > -1) {
                pages.push(key);
            }
        });
        return pages.filter((page, index) => pages.indexOf(page) == index);
    }
    static get_structure(file: string, package_tree: any) {
        const type = file.split(sep).shift();
        const components = ((this.cache[type] && this.cache[type][file]) || []).map((component) => {
            return this.get_structure(component, package_tree);
        });
        return {
            file,
            pkg: package_tree[`src/${file}`],
            components,
        };
    }
    static get_dependencies(file: string, wyvr_files: WyvrFile[], dependency: any): any[] {
        let dep_files = [];
        if (file && dependency) {
            Object.keys(dependency).forEach((type) => {
                if (dependency[type][file]) {
                    const files = dependency[type][file];
                    // convert the dependencies to the wyvr files
                    files.forEach((file_path: string) => {
                        // search if the file is hydrateable
                        const wyvr_file = wyvr_files.find((wyvr_file) => wyvr_file.path == join('gen/client', file_path));
                        if (wyvr_file) {
                            dep_files.push(wyvr_file);
                        }
                        // even when the current file is not hydrateable, search if it contains one
                        dep_files.push(...this.get_dependencies(file_path, wyvr_files, dependency));
                        return wyvr_file;
                    });
                }
            });
        }
        return dep_files;
    }
}
