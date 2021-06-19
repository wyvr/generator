import * as fs from 'fs';
import { join, dirname, resolve } from 'path';
import { File } from '@lib/file';
import { Build } from '@lib/build';
import { Client } from '@lib/client';
import { Logger } from './logger';

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
    // @obsolete
    static async execute_routes(routes: string[]) {
        const result = await Promise.all(
            routes.map(async (route) => {
                if (route.match(/\.js$/)) {
                    const route_module = await require(route);
                    return this.inject_source(route_module);
                }
                // if (route.match(/\.svelte$/)) {
                //     // convert svelte files to json
                //     const url = route.replace(join(process.cwd(), 'gen/routes'), '').replace(/\.svelte$/, '');
                //     const content = fs.readFileSync(route, { encoding: 'utf-8' });
                //     const config = Client.parse_wyvr_config(content);
                //     console.log(config);
                //     // const match = content.match(/wyvr:\s+(\{[^}]+\})/);
                //     // if (match) {
                //     //     console.log(match)
                //     // }
                //     const compiled = Build.compile(content);
                //     const rendered = Build.render(compiled, {});
                //     return {
                //         url,
                //         content: `${rendered.result.html}<style>${rendered.result.css.code}</style>`,
                //     };
                // }
                return null;
            })
        );
        return [].concat(...result.filter((x) => x));
    }
    static async execute_route(route: string) {
        if (route.match(/\.js$/)) {
            const route_module = await require(route);
            return this.inject_source(route_module);
        }
        // if (route.match(/\.svelte$/)) {
        //     // convert svelte files to json
        //     const url = route.replace(join(process.cwd(), 'gen/routes'), '').replace(/\.svelte$/, '');
        //     const content = fs.readFileSync(route, { encoding: 'utf-8' });
        //     const config = Client.parse_wyvr_config(content);
        //     console.log(config);
        //     // const match = content.match(/wyvr:\s+(\{[^}]+\})/);
        //     // if (match) {
        //     //     console.log(match)
        //     // }
        //     const compiled = Build.compile(content);
        //     const rendered = Build.render(compiled, {});
        //     return {
        //         url,
        //         content: `${rendered.result.html}<style>${rendered.result.css.code}</style>`,
        //     };
        // }
        return null;
    }
    static inject_source(route_entries: any[] | any) {
        if (!Array.isArray(route_entries)) {
            route_entries = [route_entries];
        }
        return route_entries.map((entry: any) => {
            // ignore entries without sources
            if (!entry?._wyvr?.source) {
                return entry;
            }
            const source_path = join(process.cwd(), 'gen/routes', entry._wyvr.source);
            if (!fs.existsSync(source_path)) {
                entry.error = `source file ${source_path} does not exist`;
                return entry;
            }
            const source_code = fs.readFileSync(source_path, { encoding: 'utf-8' });
            if (!source_code) {
                entry.error = `empty source file ${source_path}`;
                return entry;
            }
            const compiled = Build.compile(source_code);
            if (compiled.error) {
                // svelte error messages
                Logger.error('[svelte]', source_path, compiled);
                return entry;
            }
            const rendered = Build.render(compiled, entry);
            entry.content = `${rendered.result.html}<style>${rendered.result.css.code}</style>`;
            return entry;
        });
    }
    static write_route(route_entry: any, hook_before_process: Function = null) {
        if(!route_entry || !route_entry.url) {
            return null;
        }
        const url = route_entry.url;
        if (hook_before_process && typeof hook_before_process == 'function') {
            route_entry = hook_before_process(route_entry);
        }
        const path = File.to_index(join(process.cwd(), 'imported/data', url), 'json');
        fs.mkdirSync(dirname(path), { recursive: true });
        fs.writeFileSync(path, JSON.stringify(route_entry));
        return path;
    }
    static remove_routes_from_cache() {
        Object.keys(require.cache).forEach((cache_file) => {
            if (cache_file.match(/\/routes\//)) {
                delete require.cache[cache_file];
            }
        });
    }
}
