import * as fs from 'fs';
import { join, dirname } from 'path';
import { File } from '@lib/file';

export class Routes {
    static collect_routes(dir: string = null) {
        if (!dir) {
            dir = join(process.cwd(), 'routes');
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
    static async execute_routes(routes: string[]) {
        const result = await Promise.all(
            routes.map(async (route) => {
                const route_module = require(route);
                if (!Array.isArray(route_module)) {
                    return [route_module];
                }
                return route_module;
            })
        );
        return [].concat(...result);
    }
    static write_routes(route_entries: any[], hook_before_process: Function = null) {
        return route_entries.map((data, index) => {
            const url = data.url || '/route/' + index;
            if(hook_before_process && typeof hook_before_process == 'function') {
                data = hook_before_process(data);
            }
            const path = File.to_index(join(process.cwd(), 'imported/data', url), 'json');
            fs.mkdirSync(dirname(path), { recursive: true });
            fs.writeFileSync(path, JSON.stringify(data));
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
