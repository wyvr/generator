import * as fs from 'fs';
import { join, dirname, resolve } from 'path';
import { File } from '@lib/file';
import { Build } from '@lib/build';
import { Client } from '@lib/client';
import { Logger } from '@lib/logger';
import { WyvrFile } from '@lib/model/wyvr/file';

export class Routes {
    static collect_routes(dir: string = null, package_tree: any = null) {
        if (!dir) {
            dir = join(process.cwd(), 'gen/routes');
        }
        if (!fs.existsSync(dir)) {
            return [];
        }
        const entries = fs.readdirSync(dir);
        const result = [];
        entries.forEach((entry) => {
            const path = join(dir, entry);
            const stat = fs.statSync(path);
            if (stat.isDirectory()) {
                result.push(...this.collect_routes(path, package_tree));
                return;
            }
            if (stat.isFile() && entry.match(/\.js$/)) {
                const rel_path = path.replace(/.*?\/routes\//, 'routes/');
                const pkg = package_tree && package_tree[rel_path] ? package_tree[rel_path] : null;
                const route = {
                    path,
                    rel_path,
                    pkg,
                };
                result.push(route);
            }
        });
        return result;
    }
    static async execute_route(route: { path: string; rel_path: string, pkg: any }, global_data: any) {
        if (route.path.match(/\.js$/)) {
            (<any>global).getGlobal = (key, fallback) => {
                return Client.get_global(key, fallback || null, global_data);
            };
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
        if (!route_entries) {
            return null;
        }
        return route_entries.map((route: any) => {
            if (!route || !route.url) {
                return null;
            }
            const url = route.url;
            if (hook_before_process && typeof hook_before_process == 'function') {
                route = hook_before_process(route);
            }
            const path = File.to_extension(File.to_index(join(process.cwd(), 'imported/data', url), 'json'), 'json');
            fs.mkdirSync(dirname(path), { recursive: true });
            fs.writeFileSync(path, JSON.stringify(route));
            return path;
        });
    }
}
