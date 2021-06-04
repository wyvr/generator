import * as fs from 'fs';
import { join, resolve } from 'path';
import * as rollup from 'rollup';
import svelte from 'rollup-plugin-svelte';
import node_resolve from '@rollup/plugin-node-resolve';
import alias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';
import css from 'rollup-plugin-css-only';
import { terser } from 'rollup-plugin-terser';
import { WyvrFile, WyvrFileConfig } from '@lib/model/wyvr/file';

export class Client {
    static async create_bundles(cwd: string, files: any[], hydrate_files: WyvrFile[]) {
        //HydrateFileEntry[]) {
        const client_root = join(cwd, 'gen', 'client');

        files.map(async (entry, index) => {
            const input_file = join(client_root, `${entry.name}.js`);

            const content = hydrate_files
                .map((file) => {
                    const import_path = file.path.replace(/^gen\/client/, '@src');
                    const var_name = file.name.toLowerCase().replace(/\s/g, '_');
                    return `
                        import ${var_name} from '${import_path}';

                        const ${var_name}_target = document.querySelectorAll('[data-hydrate="${file.name}"]');
                        wyvr_hydrate(${var_name}_target, ${var_name})
                    `;
                })
                .join('\n');

            fs.writeFileSync(
                input_file,
                `
                const wyvr_hydrate = (elements, cls) => {
                    if(!elements) {
                        return null;
                    }
                    return Array.from(elements).map((el)=>{ 
                        el.innerHTML = '';
                        new cls({
                            target: el,
                            props: {}
                        })
                        el.setAttribute('data-hydrated', 'true');
                        return el;
                    })
                }
                window.getGlobal = (string, fallback) => {
                    return fallback;
                }
                ${content}
                `
            );

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
                        },
                    }),
                    node_resolve({ browser: true }),
                    commonjs(),
                    css({ output: 'gen/default.css' }),
                    // terser(),
                ],
            };
            const output_options: any = {
                file: `gen/js/${entry.name}.js`,
                // sourcemap: true,
                format: 'iife',
                name: 'app',
            };
            try {

                const bundle = await rollup.rollup(input_options);
                const { output } = await bundle.generate(output_options);
                await bundle.write(output_options);
            } catch(e){
                console.error(e)
                return false;
            }
            return true;
        });
    }
    static collect_svelte_files(dir: string = null) {
        if (!dir) {
            dir = join(process.cwd(), 'src');
        }
        const entries = fs.readdirSync(dir);
        const result = [];
        entries.forEach((entry) => {
            const path = join(dir, entry);
            const stat = fs.statSync(path);
            if (stat.isDirectory()) {
                result.push(...this.collect_svelte_files(path));
                return;
            }
            if (stat.isFile() && entry.match(/\.svelte$/)) {
                result.push(new WyvrFile(path));
            }
        });

        return result;
    }
    static correct_svelte_file_import_paths(svelte_files: WyvrFile[]): WyvrFile[] {
        //HydrateFileEntry[] {

        return svelte_files.map((file) => {
            const content = fs.readFileSync(file.path, { encoding: 'utf-8' });
            if (content) {
                const corrected_imports = content.replace(/'@src\//g, "'src/").replace(/from 'src\//g, `from '${process.cwd()}/gen/src/`);
                fs.writeFileSync(file.path, corrected_imports);
            }
            return file;
        });
    }
    static get_hydrateable_svelte_files(svelte_files: WyvrFile[]): WyvrFile[] {
        //HydrateFileEntry[] {

        return svelte_files
            .map((file) => {
                const content = fs.readFileSync(file.path, { encoding: 'utf-8' });
                const match = content.match(/wyvr:\s+(\{[^}]+\})/);
                if (match) {
                    let config: WyvrFileConfig = null;
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
                    file.config = config;
                    return file;
                }
                return null;
            })
            .filter((x) => x);
    }
    static transform_hydrateable_svelte_files(files: any[]) {
        //HydrateFileEntry[]) {
        return files.map((entry) => {
            if (entry.config.render == 'hydrate') {
                // split svelte file apart to inject markup for the hydration
                let content = fs.readFileSync(entry.path, { encoding: 'utf-8' });
                // extract scripts
                const script_result = this.extract_tags_from_content(content, 'script');
                entry.scripts = script_result.result;
                content = script_result.content;
                // extract styles
                const style_result = this.extract_tags_from_content(content, 'style');
                entry.styles = style_result.result;
                content = style_result.content;
                // add hydrate tag
                const hydrate_tag = entry.config.display == 'inline' ? 'span' : 'div';
                content = `<${hydrate_tag} data-hydrate="${entry.name}">${content}</${hydrate_tag}>`;
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
                    .toLowerCase();
            })
            .filter((p, i, arr) => {
                // remove duplicate entries
                return arr.indexOf(p) == i;
            })
            .join('_');
    }
}
