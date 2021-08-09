import { readFileSync, mkdirSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname, resolve } from 'path';
import marked from 'marked';
import fm from 'front-matter';
import { File } from '@lib/file';
import { Route } from '@lib/model/route';
import { Global } from '@lib/global';

export class Routes {
    static collect_routes(dir: string = null, package_tree: any = null) {
        if (!dir) {
            dir = join(process.cwd(), 'gen/routes');
        }
        if (!existsSync(dir)) {
            return [];
        }
        const entries = readdirSync(dir);
        const result: Route[] = [];
        entries.forEach((entry) => {
            const path = join(dir, entry);
            const stat = statSync(path);
            if (stat.isDirectory()) {
                result.push(...this.collect_routes(path, package_tree));
                return;
            }
            if (!entry.match(/^_/) && entry.match(/\.js|\.md$/)) {
                const rel_path = path.replace(/.*?\/routes\//, 'routes/');
                const pkg = package_tree && package_tree[rel_path] ? package_tree[rel_path] : null;
                const route = new Route({
                    path,
                    rel_path,
                    pkg
                });
                result.push(route);
                return;
            }
        });
        return result;
    }
    static async execute_route(route: Route) {
        if (!route || !route.path) {
            return [`broken route ${JSON.stringify(route)}`, null];
        }
        if (!(<any>global).getGlobal || typeof (<any>global).getGlobal != 'function') {
            (<any>global).getGlobal = async (key, fallback, callback) => {
                return await Global.get_global(key, fallback || null, callback);
            };
        }
        if (route.path.match(/\.md$/)) {
            const content = readFileSync(route.path, { encoding: 'utf-8' });
            if (!content) {
                return [null, null];
            }
            try {
                const data: any = fm(content);
                if (typeof data.body == 'string') {
                    data.content = marked(data.body, {
                        breaks: false,
                    }).replace(/<code[^>]*>[\s\S]*?<\/code>/g, (match) => {
                        const replaced = match.replace(/\{/g, '&lbrace;').replace(/\}/g, '&rbrace;');
                        return replaced;
                    });
                    // remove the original markdown code because it breaks the injection of data
                    delete data.body;
                }
                // unfold attributes
                Object.keys(data.attributes).forEach((key) => {
                    data[key] = data.attributes[key];
                });
                if (data.frontmatter) {
                    delete data.frontmatter;
                }
                delete data.attributes;
                // add required url
                if (!data.url) {
                    let url = File.to_extension(route.rel_path.replace(/^routes\//, '/'), 'html');
                    // remove unneeded index.html
                    if (url.indexOf('index.htm') > -1) {
                        url = url.replace(/index\.htm[l]$/, '');
                    }
                    data.url = url;
                }
                return [null, [data]];
            } catch (e) {
                return [e, null];
            }
        }
        if (route.path.match(/\.js$/)) {
            let route_module = null;
            try {
                route_module = await require(route.path);
            } catch (e) {
                return [e, null];
            }
            if (Array.isArray(route_module)) {
                return [null, route_module];
            }
            if (typeof route_module == 'function') {
                try {
                    const route_result = await route_module(route);
                    if (Array.isArray(route_result)) {
                        return [null, route_result];
                    }
                    return [null, [route_result]];
                } catch (e) {
                    return [e, null];
                }
            }
            return [null, [route_module]];
        }
        return [null, null];
    }
    static write_routes(route_entries: any[], hook_before_process: Function = null) {
        if (!Array.isArray(route_entries)) {
            return null;
        }
        return route_entries
            .map((route: any) => {
                if (!route || !route.url) {
                    return null;
                }
                const url = route.url;
                if (hook_before_process && typeof hook_before_process == 'function') {
                    // replace route with hook result
                    route = hook_before_process(route);
                }
                if (!route) {
                    return null;
                }
                const path = File.to_extension(File.to_index(join(process.cwd(), 'gen', 'data', url), 'json'), 'json');
                mkdirSync(dirname(path), { recursive: true });
                writeFileSync(path, JSON.stringify(route));
                return path;
            })
            .filter((x) => x);
    }
}
