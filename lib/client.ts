import * as fs from 'fs';
import { join, resolve } from 'path';
import * as rollup from 'rollup';
import svelte from 'rollup-plugin-svelte';
import node_resolve from '@rollup/plugin-node-resolve';
import alias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';
import css from 'rollup-plugin-css-only';
import json from '@rollup/plugin-json';
import { terser } from 'rollup-plugin-terser';
import { WyvrFile, WyvrFileConfig, WyvrFileLoading, WyvrFileRender } from '@lib/model/wyvr/file';
import { File } from '@lib/file';
import { Env } from '@lib/env';
import { Error } from '@lib/error';
import { Transform } from '@lib/transform';
import { Logger } from '@lib/logger';
import { Cwd } from '@lib/vars/cwd';
import { IIdentifierFile } from '@lib/interface/identifier';
import { is_lazy } from '@lib/helper/wyvr_file';

export class Client {
    static transform_resource(content) {
        return content.replace(/\/\/# sourceMappingURL=[^\n]*/g, '');
    }
    static async create_bundle(entry: IIdentifierFile, hydrate_files: WyvrFile[]) {
        // File.write_json(join(Cwd.get(), 'cache', 'client', `${entry.name.replace(/\./g, '-')}.json`), hydrate_files)
        Env.set(process.env.WYVR_ENV);
        const client_root = join(Cwd.get(), 'gen', 'client');

        const input_file = join(client_root, `${entry.name.replace(/\./g, '-')}.js`);
        const lazy_input_files = [];
        const idle_input_files = [];
        const media_input_files = [];
        const none_input_files = [];
        const contains_shortcodes = !!entry.shortcodes;

        const resource_folder = join(__dirname, 'resource');
        // create empty file because it is required as identifier
        const script_partials = {
            hydrate: this.transform_resource(File.read(join(resource_folder, 'hydrate.js'))),
            props: this.transform_resource(File.read(join(resource_folder, 'props.js'))),
            portal: this.transform_resource(File.read(join(resource_folder, 'portal.js'))),
            lazy: this.transform_resource(File.read(join(resource_folder, 'hydrate_lazy.js'))),
            idle: this.transform_resource(File.read(join(resource_folder, 'hydrate_idle.js'))),
            media: this.transform_resource(File.read(join(resource_folder, 'hydrate_media.js'))),
            none: this.transform_resource(File.read(join(resource_folder, 'hydrate_none.js'))),
            env: this.transform_resource(File.read(join(resource_folder, 'env.js'))),
            events: this.transform_resource(File.read(join(resource_folder, 'events.js'))),
            i18n: this.transform_resource(File.read(join(resource_folder, 'i18n_client.js'))),
            debug: '',
        };
        if (Env.is_dev() && !contains_shortcodes) {
            script_partials.debug = this.transform_resource(File.read(join(resource_folder, 'debug.js')));
        }
        // shortcode files doesn't need scripts
        if (contains_shortcodes) {
            script_partials.env = '';
            script_partials.events = '';
            script_partials.i18n = '';
        }
        // insert the executable
        if (script_partials.i18n) {
            try {
                const content = this.transform_resource(File.read(join(resource_folder, 'i18n.js')));
                script_partials.i18n = script_partials.i18n.replace(/__I18N__/g, content);
            } catch (e) {
                Logger.error('[client]', Error.extract(e, 'i18n'));
            }
        }
        const base_bundle = [script_partials.env, script_partials.events, script_partials.debug];
        if (Env.is_dev()) {
            base_bundle.push('/* BEGIN NOTE: \n * added wyvr_props because of env dev \n */\n');
            base_bundle.push(script_partials.props);
            base_bundle.push('/* END NOTE */');
        }
        // when no hydrateable files are available create minimal bundle
        if (hydrate_files.length == 0) {
            File.write(Client.get_identfier_file_path(entry.name), base_bundle.join(''));
            return [null, null];
        }
        const content = await Promise.all(
            hydrate_files.map(async (file) => {
                // file which are childs of lazy files(wyvr loading != instant) are not allowed to be generated, otherwise the code is included twice
                if (file.from_lazy) {
                    return '';
                }
                const import_path = join(Cwd.get(), file.path);
                const var_name = file.name.toLowerCase().replace(/\s/g, '_').replace(/-/g, '_');

                const lazy_input_path = join(
                    client_root,
                    `${File.to_extension(file.path, '')
                        .replace(join('gen', 'client') + '/', '')
                        .replace(/\./g, '-')}.js`
                );
                const lazy_input_name = File.to_extension(lazy_input_path, '')
                    .replace(client_root + '/', '')
                    .replace(/\./g, '-');
                const is_file_lazy = is_lazy(file);
                if (is_file_lazy) {
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
                    if (file.config?.loading == WyvrFileLoading.none) {
                        none_input_files.push(file);
                    }
                    // write the lazy file from the component
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
                        const [error] = await this.process_bundle(lazy_input_path, lazy_input_name);
                        if (error) {
                            Logger.error('[svelte]', error);
                        }
                    }
                }

                switch (file.config?.loading) {
                    case WyvrFileLoading.lazy:
                    case WyvrFileLoading.idle:
                    case WyvrFileLoading.media:
                    case WyvrFileLoading.none: {
                        const trigger = file.config.loading == WyvrFileLoading.none ? `, '${file.config.trigger}'` : '';
                        return `
                        const ${var_name}_target = document.querySelectorAll('[data-hydrate="${file.name}"]');
                        wyvr_hydrate_${file.config.loading}('/js/${lazy_input_name}.js', ${var_name}_target, '${file.name}', '${var_name}'${trigger});
                        `;
                    }

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
        const script_content = [].concat(base_bundle, [
            script_partials.hydrate,
            script_partials.portal,
            script_partials.i18n,
        ]);
        if (!Env.is_dev()) {
            script_content.push(script_partials.props);
        }
        if (lazy_input_files.length > 0) {
            script_content.push(script_partials.lazy);
        }
        if (idle_input_files.length > 0) {
            script_content.push(script_partials.idle);
        }
        if (media_input_files.length > 0) {
            script_content.push(script_partials.media);
        }
        if (none_input_files.length > 0) {
            script_content.push(script_partials.none);
        }
        script_content.push(content.join('\n'));

        File.write(input_file, script_content.join('\n'));

        const [error, result] = await this.process_bundle(input_file, entry.name.replace(/\./g, '-'));
        if (error) {
            Logger.error('[svelte]', error);
        }
        return [error, result];
    }

    static async process_bundle(input_file: string, name: string) {
        const input_options = {
            input: input_file,
            onwarn: (warning) => {
                // remove unneeded warnings
                if (this.ignore_warning(warning)) {
                    return;
                }
                Logger.warning('[svelte]', Error.get(warning, input_file, 'bundle'));
            },
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
                json(),
                css({ output: `gen/${name}.css` }),
            ],
        };
        // compress the output
        if (Env.is_prod()) {
            input_options.plugins.push(terser());
        }
        const output_options: rollup.OutputOptions = {
            // dir: `gen/js`,
            file: join(Cwd.get(), 'gen', 'js', `${name}.js`),
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
    static correct_import_paths(content: string, extension: string): string {
        return Transform.src_import_path(content, 'gen/client', extension);
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
                const content = File.read(file.path);
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
    static transform_hydrateable_svelte_files(files: WyvrFile[]) {
        return files.map((file) => {
            if (file.config && file.config.render == WyvrFileRender.hydrate) {
                // split svelte file apart to inject markup for the hydration
                const content = this.transform_content_to_hydrate(File.read(file.path), file);
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
        const script_result = Transform.extract_tags_from_content(content, 'script');
        file.scripts = script_result.result;
        content = script_result.content;
        file.props = this.extract_props_from_scripts(script_result.result);
        // create props which gets hydrated
        const props_include = `data-props="${file.props
            .map((prop) => `{_wyvrGenerateProp('${prop}', ${prop})}`)
            .join(',')}"`;

        // add portal when set
        const portal = file.config.portal ? `data-portal="${file.config.portal}"` : '';
        // add media when loading is media
        const media = file.config.loading == WyvrFileLoading.media ? `data-media="${file.config.media}"` : '';
        // extract styles
        const style_result = Transform.extract_tags_from_content(content, 'style');
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

    static get_identifier_name(root_paths: string[], ...parts: string[]): string {
        const default_sign = 'default';
        if (!root_paths || root_paths.length == 0 || !parts || parts.length == 0) {
            return default_sign;
        }
        const replace_pattern = new RegExp(
            `^${root_paths.map((path) => path.replace(/\//g, '/').replace(/\/$/, '') + '/').join('|')}`
        );
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
        const start_index = content.indexOf(search_string);
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
        return this.replace_slots(
            content,
            (name: string, slot: string) => `<div data-client-slot="${name}">${slot}</div>`
        );
    }

    static css_hash(data: { hash; css; name; filename }) {
        if (!data || !data.hash || !data.css) {
            return 'wyvr';
        }
        return `wyvr-${data.hash(data.css)}`;
    }
    static ignore_warning(warning): boolean {
        // caused by the combining of the files
        if (
            warning.message ==
            "Error when using sourcemap for reporting an error: Can't resolve original location of error."
        ) {
            return true;
        }
        // axios warning, don't know if it's really critical
        if (
            warning.message.indexOf('Circular dependency:') > -1 &&
            warning.message.indexOf('node_modules/axios/lib/defaults.js') > -1 &&
            warning.message.indexOf('node_modules/axios/lib/adapters/xhr.js') > -1
        ) {
            return true;
        }
        return false;
    }
    static get_identfier_file_path(name: string) {
        return join(Cwd.get(), 'gen', 'js', `${name.replace(/\./g, '-')}.js`);
    }
}
