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
import sass from 'sass';
import { Logger } from '@lib/logger';

export class Client {
    static transform_resource(content) {
        return content.replace(/\/\/# sourceMappingURL=[^\n]*/g, '');
    }
    static async create_bundle(cwd: string, entry: any, hydrate_files: WyvrFile[]) {
        Env.set(process.env.WYVR_ENV);
        const client_root = join(cwd, 'gen', 'client');

        const input_file = join(client_root, `${entry.name}.js`);
        const lazy_input_files = [];
        const idle_input_files = [];
        const media_input_files = [];
        const contains_shortcodes = !!entry.shortcodes;

        const resource_folder = join(__dirname, 'resource');
        // create empty file because it is required as identifier
        const script_partials = {
            hydrate: this.transform_resource(fs.readFileSync(join(resource_folder, 'hydrate.js'), { encoding: 'utf-8' })),
            props: this.transform_resource(fs.readFileSync(join(resource_folder, 'props.js'), { encoding: 'utf-8' })),
            portal: this.transform_resource(fs.readFileSync(join(resource_folder, 'portal.js'), { encoding: 'utf-8' })),
            lazy: this.transform_resource(fs.readFileSync(join(resource_folder, 'hydrate_lazy.js'), { encoding: 'utf-8' })),
            idle: this.transform_resource(fs.readFileSync(join(resource_folder, 'hydrate_idle.js'), { encoding: 'utf-8' })),
            media: this.transform_resource(fs.readFileSync(join(resource_folder, 'hydrate_media.js'), { encoding: 'utf-8' })),
            env: this.transform_resource(fs.readFileSync(join(resource_folder, 'env.js'), { encoding: 'utf-8' })),
            events: this.transform_resource(fs.readFileSync(join(resource_folder, 'events.js'), { encoding: 'utf-8' })),
            debug: '',
        };
        if (Env.is_dev() && !contains_shortcodes) {
            script_partials.debug = this.transform_resource(fs.readFileSync(join(resource_folder, 'debug.js'), { encoding: 'utf-8' }));
        }
        // shortcode files doesn't need scripts
        if (contains_shortcodes) {
            script_partials.env = '';
            script_partials.events = '';
        }
        // when no hydrateable files are available create minimal bundle
        if (hydrate_files.length == 0) {
            const empty_bundle = [script_partials.env, script_partials.events, script_partials.debug];
            File.write(join(cwd, 'gen', 'js', `${entry.name}.js`), empty_bundle.join(''));
            return [null, null];
        }
        const content = await Promise.all(
            hydrate_files.map(async (file) => {
                const import_path = join(cwd, file.path);
                const var_name = file.name.toLowerCase().replace(/\s/g, '_');

                const lazy_input_path = join(client_root, `${File.to_extension(file.path, '').replace(join('gen', 'client') + '/', '')}.js`);
                const lazy_input_name = File.to_extension(lazy_input_path, '').replace(client_root + '/', '');
                const is_lazy = [WyvrFileLoading.lazy, WyvrFileLoading.idle, WyvrFileLoading.media].indexOf(file.config?.loading) > -1;
                if (is_lazy) {
                    // add to the list of lazy type
                    if (file.config?.loading == WyvrFileLoading.lazy) {
                        lazy_input_files.push(file);
                    }
                    if (file.config?.loading == WyvrFileLoading.idle) {
                        idle_input_files.push(file);
                    }
                    if (file.config?.loading == WyvrFileLoading.media) {
                        media_input_files.push(file);
                    }
                    // write the lazy file fro the component
                    if (!fs.existsSync(lazy_input_path)) {
                        File.write(
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
                }

                switch (file.config?.loading) {
                    case WyvrFileLoading.lazy:
                    case WyvrFileLoading.idle:
                    case WyvrFileLoading.media:
                        return `
                            const ${var_name}_target = document.querySelectorAll('[data-hydrate="${file.name}"]');
                            wyvr_hydrate_${file.config.loading}('/js/${lazy_input_name}.js', ${var_name}_target, '${file.name}', '${var_name}');
                            `;

                    //case WyvrFileLoading.instant:
                    default:
                        return `
                            import ${var_name} from '${import_path}';

                            const ${var_name}_target = document.querySelectorAll('[data-hydrate="${file.name}"]');
                            wyvr_hydrate(${var_name}_target, ${var_name})
                            `;
                }
            })
        );
        const script_content = [script_partials.hydrate, script_partials.props, script_partials.portal, script_partials.debug, script_partials.env, script_partials.events];
        if (lazy_input_files.length > 0) {
            script_content.push(script_partials.lazy);
        }
        if (idle_input_files.length > 0) {
            script_content.push(script_partials.idle);
        }
        if (media_input_files.length > 0) {
            script_content.push(script_partials.media);
        }
        script_content.push(content.join('\n'));

        File.write(input_file, script_content.join('\n'));

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
            sourcemap: false,
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
        if (!svelte_files || !Array.isArray(svelte_files)) {
            return [];
        }
        //HydrateFileEntry[] {
        return svelte_files
            .map((file) => {
                if (!file || !file.path) {
                    return null;
                }
                const content = fs.readFileSync(file.path, { encoding: 'utf-8' });
                if (content) {
                    const corrected_imports = this.correct_import_paths(content);
                    fs.writeFileSync(file.path, corrected_imports);
                }
                return file;
            })
            .filter((x) => x);
    }
    static correct_import_paths(content: string): string {
        if (!content || typeof content != 'string') {
            return '';
        }
        return content.replace(/(['"])@src\//g, `$1${process.cwd()}/gen/src/`);
    }
    static get_hydrateable_svelte_files(svelte_files: WyvrFile[]): WyvrFile[] {
        if (!svelte_files || !Array.isArray(svelte_files)) {
            return [];
        }
        return svelte_files
            .map((file) => {
                if (!file || !file.path) {
                    return null;
                }
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
        const match = content.match(/wyvr:\s+(\{[^}]*\})/);
        if (match) {
            config = new WyvrFileConfig();
            match[1].split('\n').forEach((row) => {
                const cfg_string = row.match(/(\w+): ['"]([^'"]*)['"]/);
                if (cfg_string) {
                    config[cfg_string[1]] = cfg_string[2];
                    return;
                }
                const cfg_bool = row.match(/(\w+): (true|false)/);
                if (cfg_bool) {
                    config[cfg_bool[1]] = cfg_bool[2] === 'true';
                    return;
                }
                const cfg_number = row.match(/(\w+): ([\d,.]+)/);
                if (cfg_number) {
                    config[cfg_number[1]] = parseFloat(cfg_number[2]);
                    return;
                }
            });
        }

        return config;
    }
    static preprocess_content(content: string): [any, string] {
        if (!content || typeof content != 'string') {
            return [null, ''];
        }
        const style_result = this.extract_tags_from_content(content, 'style');
        if (style_result && style_result.result && style_result.result.some((entry) => entry.indexOf('type="text/scss"') > -1 || entry.indexOf('lang="sass"') > -1)) {
            let sass_result = null;
            try {
                sass_result = sass.renderSync({
                    data: style_result.result
                        .map((entry) => {
                            const raw = entry.replace(/<style[^>]*>/g, '').replace(/<\/style>/g, '');
                            return this.correct_import_paths(raw);
                        })
                        .join('\n'),
                });
            } catch (e) {
                return [Error.get(e, e.file, 'sass'), content];
            }
            if (sass_result) {
                return [null, `${style_result.content}<style>${sass_result.css.toString()}</style>`];
            }
        }

        return [null, content];
    }
    static transform_hydrateable_svelte_files(files: WyvrFile[]) {
        return files.map((file) => {
            if (file.config && file.config.render == WyvrFileRender.hydrate) {
                // split svelte file apart to inject markup for the hydration
                const content = this.transform_content_to_hydrate(fs.readFileSync(file.path, { encoding: 'utf-8' }), file);
                fs.writeFileSync(file.path, `${file.scripts.join('')}\n${file.styles.join('')}\n${content}`);
            }
            return file;
        });
    }
    static transform_content_to_hydrate(content: string, file: WyvrFile): string {
        if (!content || typeof content != 'string' || !file) {
            return '';
        }
        // extract scripts
        const script_result = this.extract_tags_from_content(content, 'script');
        file.scripts = script_result.result;
        content = script_result.content;
        file.props = this.extract_props_from_scripts(script_result.result);
        // create props which gets hydrated
        const props_include = `data-props="${file.props.map((prop) => `'${prop}':{JSON.stringify(${prop}).replace(/"/g, "'")}`).join(',')}"`;
        // add portal when set
        const portal = file.config.portal ? `data-portal="${file.config.portal}"` : '';
        // add media when loading is media
        const media = file.config.loading == WyvrFileLoading.media ? `data-media="${file.config.media}"` : '';
        // extract styles
        const style_result = this.extract_tags_from_content(content, 'style');
        file.styles = style_result.result;
        content = style_result.content;
        // add hydrate tag
        const hydrate_tag = file.config.display == 'inline' ? 'span' : 'div';
        // debug info
        const debug_info = Env.is_dev() ? `data-hydrate-path="${file.rel_path}"` : '';
        content = `<${hydrate_tag} data-hydrate="${file.name}" ${debug_info} ${props_include} ${portal} ${media}>${content}</${hydrate_tag}>`;
        content = this.replace_slots_static(content);
        return content;
    }
    static extract_tags_from_content(content: string, tag: string): { content: string; result: string[] } {
        if (!content || typeof content != 'string' || !tag || typeof tag != 'string') {
            return {
                content: content || '',
                result: [],
            };
        }
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
    static get_identifier_name(root_paths: string[], ...parts: string[]): string {
        const default_sign = 'default';
        if (!root_paths || root_paths.length == 0 || !parts || parts.length == 0) {
            return default_sign;
        }
        const replace_pattern = new RegExp(`^${root_paths.map((path) => path.replace(/\//g, '/').replace(/\/$/, '') + '/').join('|')}`);
        const result = parts
            .filter((x) => x)
            .map((part) => {
                // remove the root paths to get shorter identifiers
                return part
                    .replace(replace_pattern, '')
                    .replace(/\.svelte$/, '')
                    .toLowerCase()
                    .replace(/[/_]/g, '-');
            })
            .join('_');
        if (!result) {
            return default_sign;
        }
        return result;
    }

    static extract_props_from_scripts(scripts: string[]): string[] {
        const props = [];
        if (!scripts || !Array.isArray(scripts) || !scripts.every((item) => typeof item == 'string')) {
            return props;
        }
        scripts.forEach((script) => {
            //export let price = null;
            //export let price;
            //export let price
            script.replace(/export let ([^ =;\n]*)/g, (_, prop) => {
                props.push(prop);
                return '';
            });
        });
        return props.filter((prop, index) => props.indexOf(prop) == index);
    }
    static replace_slots(content: string, fn: (name: string, slot: string) => string): string {
        if (!content || typeof content != 'string') {
            return '';
        }
        const content_replaced = content.replace(/(<slot[^>/]*>.*?<\/slot>|<slot[^>]*\/>)/g, (_, slot) => {
            const match = slot.match(/name="(.*)"/);
            let name = null;
            if (match) {
                name = match[1];
            }
            return fn(name || 'default', slot);
        });
        return content_replaced;
    }
    static replace_slots_static(content: string): string {
        return this.replace_slots(content, (name: string, slot: string) => `<span data-slot="${name}">${slot}</span>`);
    }
    static remove_on_server(content: string) {
        if (!content || typeof content != 'string') {
            return '';
        }
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
        return this.replace_slots(content, (name: string, slot: string) => `<div data-client-slot="${name}">${slot}</div>`);
    }
    static insert_splits(file_path: string, content: string): string {
        if (!file_path || !fs.existsSync(file_path) || !content || typeof content != 'string') {
            return '';
        }
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
    static css_hash(data: { hash; css; name; filename }) {
        if (!data || !data.hash || !data.css) {
            return 'wyvr';
        }
        return `wyvr-${data.hash(data.css)}`;
    }
}
