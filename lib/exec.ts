import { Cwd } from '@lib/vars/cwd';
import { join } from 'path';
import { existsSync, statSync } from 'fs-extra';
import { Logger } from '@lib/logger';
import { Error } from '@lib/error';
import { IExec, IExecConfig } from '@lib/interface/exec';
import { File } from '@lib/file';
import { IncomingMessage } from 'http';
import { hrtime_to_ms } from '@lib/converter/time';
import { Build } from '@lib/build';
import { create_data_result } from '@lib/worker/create_data_result';
import { RootTemplatePaths } from '@lib/vars/root_template_paths';
import { Config } from '@lib/config';
import { Generate } from '@lib/generate';
import { ReleasePath } from '@lib/vars/release_path';
import { build_identifier_script } from './worker/script';
import { Client } from './client';
import { Dependency } from './dependency';
import { IIdentifierDependency } from './interface/identifier';

export class Exec {
    static cache = null;
    static load_cache = {};
    static async init(list: string[]) {
        const cache = {};
        const exec_list = await Promise.all(
            list.map(async (file) => {
                const data = await Exec.load(file);
                if (Exec.is_valid(data)) {
                    if (Array.isArray(data.url)) {
                        data.url.map((url) => {
                            const config = Exec.extract_config(url, file);
                            cache[config.match] = config;
                        });
                    } else {
                        const config = Exec.extract_config(data.url, file);
                        cache[config.match] = config;
                    }
                    return file;
                } else {
                    Logger.warning('ignore', file, 'because it is invalid');
                }
                return null;
            })
        );
        File.write_json(join('cache', 'exec.json'), cache);
        return exec_list.filter((x) => x);
    }
    static extract_config(url: string, file: string): IExecConfig {
        const params = [];
        const match = `^${url
            .split('/')
            .map((item: string) => {
                const result = item.match(/^\[([^\]]*)\]$/);
                if (result) {
                    params.push(result[1]);
                    return '([^\\]]*)';
                }
                return item;
            })
            .join('\\/')}$`;
        return { url, file, params, match };
    }
    static has_exec_files(): boolean {
        return false;
    }
    static async load(file_path: string): Promise<IExec> {
        const path = join(Cwd.get(), file_path);
        const stat = statSync(path, { bigint: true });
        if (Exec.load_cache[path] != null) {
            if (Exec.load_cache[path] != stat.mtimeMs) {
                delete require.cache[path];
            }
        }
        Exec.load_cache[path] = stat.mtimeMs;
        try {
            const result = await require(path);
            // if (result && result.default) {
            //     return <IExec>result.default;
            // }
            if (result) {
                return <IExec>result;
            }
            return null;
        } catch (e) {
            Logger.error(Error.get(e, file_path, 'exec'));
            return null;
        }
    }
    static is_valid(data: IExec): boolean {
        if (data && data.url && (typeof data.url == 'string' || Array.isArray(data.url))) {
            return true;
        }
        return false;
    }
    static match(url: string): IExecConfig {
        if (!Exec.cache) {
            Exec.fill_cache();
        }
        const found_match = Object.keys(Exec.cache).find((key) => {
            return url.match(new RegExp(key));
        });
        if (!found_match) {
            return null;
        }
        return Exec.cache[found_match];
    }
    static async run(uid: string, req: IncomingMessage, config: IExecConfig) {
        const start = process.hrtime();
        if (!Exec.cache) {
            Exec.fill_cache();
        }
        const params_match = req.url.match(config.match);
        if (!params_match) {
            Logger.error(uid, "can't extract params from url", req.url, config);
            return null;
        }
        const code = await Exec.load(config.file);
        if (!code) {
            Logger.error(uid, "can't find file", req.url, config);
            return null;
        }
        const params = {};
        config.params.forEach((param, idx) => {
            params[param] = params_match[idx + 1];
        });
        // execute load function when set to get data
        let data = null;
        if (code.onExec && typeof code.onExec == 'function') {
            try {
                data = await code.onExec(req, params);
            } catch (e) {
                Logger.error('[exec]', 'onExec', Error.get(e, config.file, 'onExec'));
            }
        }
        const code_data = {};
        // replace function properties
        await Promise.all(
            Object.keys(code).map(async (key) => {
                if (key == 'onExec') {
                    return null;
                }
                if (typeof code[key] == 'function') {
                    try {
                        code_data[key] = await code[key](req, params, data);
                    } catch (e) {
                        Logger.error('[exec]', key, Error.get(e, config.file, key));
                    }
                    return null;
                }
                code_data[key] = JSON.parse(JSON.stringify(code[key]));
                return null;
            })
        );

        // build data
        const default_values = Config.get('default_values');
        const enhanced_data = Generate.set_default_values(Generate.enhance_data(code_data), default_values);

        const page_data = create_data_result(enhanced_data, RootTemplatePaths.get());

        // // build content
        const page_code = Build.get_page_code(enhanced_data, page_data.doc, page_data.layout, page_data.page);
        const [compile_error, compiled] = await Build.compile(page_code);

        if (compile_error) {
            // svelte error messages
            Logger.error('[svelte]', data.url, Error.get(compile_error, config.file, 'build'));
            return null;
        }
        const [render_error, rendered] = await Build.render(compiled, enhanced_data);
        if (render_error) {
            // svelte error messages
            Logger.error('[svelte]', data.url, Error.get(render_error, config.file, 'render'));
            return null;
        }

        const extension = page_data.data._wyvr?.extension;

        const path = File.to_extension(config.file.replace(new RegExp(`^.*?${join('gen', 'exec')}`), ReleasePath.get()), extension);

        // generate the script for the page
        const gen_src_folder = join(Cwd.get(), 'gen', 'raw');
        const identifier = {
            name: page_data.identifier.replace(gen_src_folder + '/', ''),
            doc: page_data.doc.replace(gen_src_folder + '/', ''),
            layout: page_data.layout.replace(gen_src_folder + '/', ''),
            page: page_data.page.replace(gen_src_folder + '/', ''),
        };
        if (!existsSync(Client.get_identfier_file_path(identifier.name))) {
            Logger.info(uid, 'exec', 'create script for', Logger.color.cyan(identifier.name));

            const svelte_files = File.collect_svelte_files('gen/client');
            // get all svelte components which should be hydrated
            const files = Client.get_hydrateable_svelte_files(svelte_files);

            await build_identifier_script({ file: identifier, dependency: <IIdentifierDependency>Dependency.cache }, files);
        }

        // remove svelte integrated comment from compiler to avoid broken output
        rendered.result.html = Build.cleanup_page_code(Build.add_debug_code(rendered.result.html, path, extension, page_data), extension);

        Logger.info(uid, 'exec', 'duration', Math.round(hrtime_to_ms(process.hrtime(start))), Logger.color.dim('ms'));
        return rendered;
    }
    static fill_cache() {
        Exec.cache = File.read_json(join('cache', 'exec.json'));
    }
}
