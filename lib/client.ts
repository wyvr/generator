import * as fs from 'fs';
import { join, resolve } from 'path';
import * as rollup from 'rollup';
import svelte from 'rollup-plugin-svelte';
import node_resolve from '@rollup/plugin-node-resolve';
import alias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';
import css from 'rollup-plugin-css-only';
import { terser } from 'rollup-plugin-terser';
import { WyvrFile, WyvrFileConfig, WyvrFileLoading, WyvrFileRender } from '@lib/model/wyvr/file';
import { File } from '@lib/file';
import { Env } from '@lib/env';
import { WorkerHelper } from '@lib/worker/helper';
import { LogType } from '@lib/model/log';
import { Error } from '@lib/error';

export class Client {
    static async create_bundle(cwd: string, entry: any, hydrate_files: WyvrFile[]) {
        Env.set(process.env.WYVR_ENV);
        const client_root = join(cwd, 'gen', 'client');

        const input_file = join(client_root, `${entry.name}.js`);
        const lazy_input_files = [];

        // create empty file because it is required as entrypoint
        if (hydrate_files.length == 0) {
            fs.writeFileSync(join(cwd, 'gen', 'js', `${entry.name}.js`), '');
            return [null, null];
        }
        const script_partials = {
            hydrate: fs.readFileSync(join(cwd, 'wyvr/resource/hydrate.js'), { encoding: 'utf-8' }),
            props: fs.readFileSync(join(cwd, 'wyvr/resource/props.js'), { encoding: 'utf-8' }),
            portal: fs.readFileSync(join(cwd, 'wyvr/resource/portal.js'), { encoding: 'utf-8' }),
            lazy: fs.readFileSync(join(cwd, 'wyvr/resource/hydrate_lazy.js'), { encoding: 'utf-8' }),
            debug: Env.is_dev() ? fs.readFileSync(join(cwd, 'wyvr/resource/debug.js'), { encoding: 'utf-8' }) : '',
        };
        const content = await Promise.all(
            hydrate_files.map(async (file) => {
                const import_path = join(cwd, file.path);
                const var_name = file.name.toLowerCase().replace(/\s/g, '_');
                if (file.config?.loading == WyvrFileLoading.lazy) {
                    lazy_input_files.push(file);
                    const lazy_input_path = join(client_root, `${File.to_extension(file.path, '').replace(join('gen', 'client') + '/', '')}.js`);
                    const lazy_input_name = File.to_extension(lazy_input_path, '').replace(client_root + '/', '');
                    if (!fs.existsSync(lazy_input_path)) {
                        fs.writeFileSync(
                            lazy_input_path,
                            `
                            ${script_partials.hydrate}
                            ${script_partials.props}
                            ${script_partials.portal}
                            import ${var_name} from '${import_path}';
    
                            const ${var_name}_target = document.querySelectorAll('[data-hydrate="${file.name}"]');
                            wyvr_hydrate(${var_name}_target, ${var_name});
                        `
                        );
                        const [error, result] = await this.process_bundle(lazy_input_path, lazy_input_name, cwd);
                        if (error) {
                            WorkerHelper.log(LogType.error, '[svelte]', error);
                        }
                    }
                    return `
                        const ${var_name}_target = document.querySelectorAll('[data-hydrate="${file.name}"]');
                        wyvr_hydrate_lazy('/js/${lazy_input_name}.js', ${var_name}_target, '${file.name}', '${var_name}');
                    `;
                }
                // WyvrFileLoading.instant
                return `
                        import ${var_name} from '${import_path}';

                        const ${var_name}_target = document.querySelectorAll('[data-hydrate="${file.name}"]');
                        wyvr_hydrate(${var_name}_target, ${var_name})
                    `;
            })
        );
        const entrypoint_content = [script_partials.hydrate];
        entrypoint_content.push(script_partials.props);
        entrypoint_content.push(script_partials.portal);
        entrypoint_content.push(script_partials.debug);
        if (lazy_input_files.length > 0) {
            entrypoint_content.push(script_partials.lazy);
        }
        entrypoint_content.push(content.join('\n'));

        fs.writeFileSync(input_file, entrypoint_content.join('\n'));

        const [error, result] = await this.process_bundle(input_file, entry.name, cwd);
        if (error) {
            WorkerHelper.log(LogType.error, '[svelte]', error);
        }
        return [error, result];
    }

    static async process_bundle(input_file: string, name: string, cwd: string) {
        const input_options = {
            input: input_file,
            plugins: [
                alias({
                    entries: [{ find: '@src', replacement: resolve('gen/client') }],
                }),
                svelte({
                    include: ['gen/client/**/*.svelte'],
                    emitCss: false,
                    compilerOptions: {
                        // By default, the client-side compiler is used. You
                        // can also use the server-side rendering compiler
                        generate: 'dom',

                        // ensure that extra attributes are added to head
                        // elements for hydration (used with generate: 'ssr')
                        hydratable: true,
                        dev: Env.is_dev(),
                        cssHash: Client.css_hash,
                    },
                }),
                node_resolve({ browser: true }),
                commonjs(),
                css({ output: `gen/${name}.css` }),
            ],
        };
        // compress the output
        if (Env.is_prod()) {
            input_options.plugins.push(terser());
        }
        const output_options: any = {
            // dir: `gen/js`,
            file: join(cwd, 'gen', 'js', `${name}.js`),
            // sourcemap: true,
            format: 'iife',
            name: 'app',
        };
        try {
            const bundle = await rollup.rollup(input_options);
            await bundle.generate(output_options);
            const result = await bundle.write(output_options);
            return [null, result];
        } catch (e) {
            return [Error.get(e, input_file, 'bundle'), null];
        }
    }

    static correct_svelte_file_import_paths(svelte_files: WyvrFile[]): WyvrFile[] {
        //HydrateFileEntry[] {

        return svelte_files.map((file) => {
            const content = fs.readFileSync(file.path, { encoding: 'utf-8' });
            if (content) {
                const corrected_imports = content.replace(/'@src\//g, `'${process.cwd()}/gen/src/`);
                fs.writeFileSync(file.path, corrected_imports);
            }
            return file;
        });
    }
    static get_hydrateable_svelte_files(svelte_files: WyvrFile[]): WyvrFile[] {
        return svelte_files
            .map((file) => {
                const content = fs.readFileSync(file.path, { encoding: 'utf-8' });
                const config = this.parse_wyvr_config(content);
                if (config) {
                    file.config = config;
                    return file;
                }
                return null;
            })
            .filter((x) => x);
    }
    static parse_wyvr_config(content: string): WyvrFileConfig {
        let config: WyvrFileConfig = null;
        if (!content) {
            return config;
        }
        const match = content.match(/wyvr:\s+(\{[^}]+\})/);
        if (match) {
            try {
                config = new WyvrFileConfig();
                match[1].split('\n').forEach((row) => {
                    const cfg_string = row.match(/(\w+): '(\w+)'/);
                    if (cfg_string) {
                        config[cfg_string[1]] = cfg_string[2];
                        return;
                    }
                    const cfg_bool = row.match(/(\w+): (true|false)/);
                    if (cfg_bool) {
                        config[cfg_bool[1]] = cfg_bool[2] === 'true';
                        return;
                    }
                    const cfg_number = row.match(/(\w+): (\d+)/);
                    if (cfg_number) {
                        config[cfg_number[1]] = parseFloat(cfg_number[2]);
                        return;
                    }
                });
            } catch (e) {
                // add error object
                config.error = e;
            }
        }

        return config;
    }
    static transform_hydrateable_svelte_files(files: WyvrFile[]) {
        return files.map((entry) => {
            if (!entry.config) {
                return entry;
            }
            if (entry.config.render == WyvrFileRender.hydrate) {
                // split svelte file apart to inject markup for the hydration
                let content = fs.readFileSync(entry.path, { encoding: 'utf-8' });
                // extract scripts
                const script_result = this.extract_tags_from_content(content, 'script');
                entry.scripts = script_result.result;
                content = script_result.content;
                entry.props = this.extract_props_from_scripts(script_result.result);
                const props_include = `data-props="${entry.props.map((prop) => `'${prop}':{JSON.stringify(${prop}).replace(/"/g, "'")}`).join(',')}"`;
                const portal = entry.config.portal ? `data-portal="${entry.config.portal}"` : '';
                // extract styles
                const style_result = this.extract_tags_from_content(content, 'style');
                entry.styles = style_result.result;
                content = style_result.content;
                // add hydrate tag
                const hydrate_tag = entry.config.display == 'inline' ? 'span' : 'div';
                content = `<${hydrate_tag} data-hydrate="${entry.name}" ${props_include} ${portal}>${content}</${hydrate_tag}>`;
                content = this.replace_slots_static(content);
                fs.writeFileSync(entry.path, `${entry.scripts.join('')}\n${entry.styles.join('')}\n${content}`);
            }
            return entry;
        });
    }
    static extract_tags_from_content(content: string, tag: string): { content: string; result: string[] } {
        let search_tag = true;
        tag = tag.toLowerCase().trim();
        const result = [];
        const tag_start = `<${tag}`;
        const tag_end = `</${tag}>`;
        let tag_start_index, tag_end_index;
        while (search_tag) {
            tag_start_index = content.indexOf(tag_start);
            tag_end_index = content.indexOf(tag_end);
            if (tag_start_index > -1 && tag_end_index > -1) {
                // append the tag into the result
                result.push(content.slice(tag_start_index, tag_end_index + tag_end.length));
                // remove the script from the content
                content = content.substr(0, tag_start_index) + content.substr(tag_end_index + tag_end.length);
                continue;
            }
            search_tag = false;
        }
        return {
            content,
            result,
        };
    }
    static get_entrypoint_name(root_paths: string[], ...parts: string[]): string {
        const replace_pattern = new RegExp(`^${root_paths.map((path) => path.replace(/\//g, '/') + '/').join('|')}`);
        return parts
            .map((part) => {
                // remove the root paths to get shorter entrypoints
                return part
                    .replace(replace_pattern, '')
                    .replace(/\.svelte$/, '')
                    .toLowerCase()
                    .replace(/\//, '-');
            })
            .filter((p, i, arr) => {
                // remove duplicate entries
                return arr.indexOf(p) == i;
            })
            .join('_');
    }
    static replace_global(content: string, global_data: any = null) {
        return content.replace(/getGlobal\(['"]([^'"]+)['"](?:,\s*([^\)]+))?\)/g, (matched, key, fallback) => {
            // getGlobal('nav.header')
            // getGlobal("nav.header")
            // getGlobal('nav.header[0]')
            // getGlobal('nav.header', [])
            // getGlobal('nav.header', true)
            // getGlobal('nav.header', 'test')
            try {
                fallback = JSON.parse(fallback);
            } catch (e) {
                fallback = null;
            }
            return JSON.stringify(this.get_global(key, fallback || null, global_data));
        });
    }
    static get_global(key: string, fallback: any = null, global_data: any = null) {
        if (!key || !global_data) {
            return fallback;
        }
        const steps = key.split('.');
        let value = fallback;
        for (let i = 0; i < steps.length; i++) {
            let step = steps[i];
            let index = null;
            // searches an element at an specific index
            if (step.indexOf('[') > -1 && step.indexOf(']') > -1) {
                const match = step.match(/^([^\[]+)\[([^\]]+)\]$/);
                if (match) {
                    step = match[1];
                    index = parseInt((match[2] + '').trim(), 10);
                }
            }
            if (i == 0) {
                value = global_data[step];
                if (value !== undefined && index != null && Array.isArray(value)) {
                    value = value[index];
                }
                continue;
            }
            if (value === undefined || (!value && !value[step])) {
                return fallback;
            }
            value = value[step];
            if (value !== undefined && index != null && Array.isArray(value)) {
                value = value[index];
            }
        }

        return value;
    }
    static extract_props_from_scripts(scripts: string[]): string[] {
        const props = [];
        scripts.forEach((script) => {
            //export let price = null;
            script.replace(/export let ([^ =]*)\s*=.*/g, (_, prop) => {
                props.push(prop);
                return '';
            });
        });
        return props;
    }
    static replace_slots_static(content: string): string {
        const content_replaced = content.replace(/(<slot[^>/]*>.*?<\/slot>|<slot[^>]*\/>)/g, (_, slot) => {
            const match = slot.match(/name="(.*)"/);
            let name = null;
            if (match) {
                name = match[1];
            }
            return `<span data-slot="${name || 'default'}">${slot}</span>`;
        });
        return content_replaced;
    }
    static remove_on_server(content: string) {
        const search_string = 'onServer(';
        let start_index = content.indexOf(search_string);
        if (start_index == -1) {
            return content;
        }
        let index = start_index + search_string.length;
        let open_brackets = 1;
        let found_closing = false;
        const length = content.length;
        while (index < length && open_brackets > 0) {
            const char = content[index];
            switch (char) {
                case '(':
                    open_brackets++;
                    break;
                case ')':
                    open_brackets--;
                    if (open_brackets == 0) {
                        found_closing = true;
                    }
                    break;
            }
            index++;
        }
        if (found_closing) {
            const replaced = content.substr(0, start_index) + content.substr(index);
            // check if more onServer handlers are used
            return this.remove_on_server(replaced);
        }
        return content;
    }
    static replace_slots_client(content: string): string {
        const content_replaced = content.replace(/(<slot[^>/]*>.*?<\/slot>|<slot[^>]*\/>)/g, (_, slot) => {
            const match = slot.match(/name="(.*)"/);
            let name = null;
            if (match) {
                name = match[1];
            }
            return `<div data-client-slot="${name || 'default'}">${slot}</div>`;
        });
        return content_replaced;
    }
    static insert_splits(file_path: string, content: string): string {
        const css_file = File.to_extension(file_path, 'css');
        if (fs.existsSync(css_file)) {
            const css_content = fs.readFileSync(css_file);
            const css_result = this.extract_tags_from_content(content, 'style');
            const combined_css = css_result.result
                .map((style) => {
                    return style.replace(/^<style>/, '').replace(/<\/style>$/, '');
                })
                .join('\n');
            content = `${css_result.content}<style>${combined_css}${css_content}</style>`;
        }
        const js_file = File.to_extension(file_path, 'js');
        if (fs.existsSync(js_file)) {
            const js_content = fs.readFileSync(js_file);
            const js_result = this.extract_tags_from_content(content, 'script');
            const combined_js = js_result.result
                .map((script) => {
                    return script.replace(/^<script>/, '').replace(/<\/script>$/, '');
                })
                .join('\n');
            content = `<script>${combined_js}${js_content}</script>${js_result.content}`;
        }
        return content;
    }
    static css_hash({ hash, css, name, filename }) {
        return `wyvr-${hash(css)}`;
    }
}
