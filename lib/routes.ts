import * as fs from 'fs';
import { join, dirname, resolve } from 'path';
import { File } from '@lib/file';
import { Build } from '@lib/build';
import { Client } from '@lib/client';
import { Logger } from '@lib/logger';
import { WyvrFile } from '@lib/model/wyvr/file';

export class Routes {
    static collect_routes(dir: string = null) {
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
                result.push(...this.collect_routes(path));
                return;
            }
            if (stat.isFile() && entry.match(/\.js$/)) {
                result.push(path);
            }
        });
        return result;
    }
    static async execute_route(route: string, global_data: any) {
        if (route.match(/\.js$/)) {
            (<any>global).getGlobal = (key, fallback) => {
                return Client.get_global(key, fallback || null, global_data);
            };
            const route_module = await require(route);
            if (!Array.isArray(route_module)) {
                return [route_module];
            }
            return route_module;
        }
        return null;
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
    static remove_routes_from_cache() {
        Object.keys(require.cache).forEach((cache_file) => {
            if (cache_file.match(/\/routes\//)) {
                delete require.cache[cache_file];
            }
        });
    }
}
