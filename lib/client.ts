import * as fs from 'fs';
import { join, resolve } from 'path';
import * as rollup from 'rollup';
import svelte from 'rollup-plugin-svelte';
import node_resolve from '@rollup/plugin-node-resolve';
import alias from '@rollup/plugin-alias';
import commonjs from '@rollup/plugin-commonjs';
import css from 'rollup-plugin-css-only';
import { terser } from 'rollup-plugin-terser';
import { HydrateFileEntry } from './model/wyvr/hydrate';

export class Client {
    static async create_bundles(cwd: string, files: any[], hydrate_files: HydrateFileEntry[]) {
        const client_root = join(cwd, 'gen', 'client');

        files.map(async (entry, index) => {
            const input_file = join(client_root, `${entry.name}.js`);

            const content = hydrate_files
                .map((file) => {
                    const import_path = file.path.replace(join(process.cwd(), 'src'), '@src');
                    const import_name = file.path.split('/').pop().replace('.svelte', '');
                    const var_name = import_name.toLowerCase();
                    return `import ${import_name} from '${import_path}';

                                document.getElementById('${import_name}').innerHTML = '';
                                const ${var_name} = new ${import_name}({
                                  target: document.getElementById('${import_name}'),
                                  props: {},
                                });
                                //export default ${var_name};`;
                })
                .join('\n');

            fs.writeFileSync(
                input_file,
                `${content}
                        window.getGlobal = (string, fallback) => {
                            return fallback;
                        }`
            );

            const input_options = {
                input: input_file,
                plugins: [
                    alias({
                        entries: [{ find: '@src', replacement: resolve('src') }],
                    }),
                    svelte({
                        include: ['src/**/*.svelte'],
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
                    terser(),
                ],
            };
            const output_options: any = {
                file: `gen/js/${entry.name}.js`,
                // sourcemap: true,
                format: 'iife',
                name: 'app',
            };
            const bundle = await rollup.rollup(input_options);
            const { output } = await bundle.generate(output_options);
            await bundle.write(output_options);
            return true;
        });
    }
    static get_hydrateable_svelte_files(dir: string = null): HydrateFileEntry[] {
        if (!dir) {
            dir = join(process.cwd(), 'src');
        }
        const entries = fs.readdirSync(dir);
        const result = [];
        entries.forEach((entry) => {
            const path = join(dir, entry);
            const stat = fs.statSync(path);
            if (stat.isDirectory()) {
                result.push(...this.get_hydrateable_svelte_files(path));
                return;
            }
            if (stat.isFile() && entry.match(/\.svelte$/)) {
                const content = fs.readFileSync(path, { encoding: 'utf-8' });
                const match = content.match(/wyvr:\s+(\{[^}]+\})/);
                if (match) {
                    let config = null;
                    try {
                        config = {};
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
                        config = { error: e };
                    }
                    result.push({
                        path,
                        config,
                    });
                }
                return;
            }
        });

        return result;
    }
    static transform_hydrateable_svelte_files(files: HydrateFileEntry[]) {
        return files.map((entry) => entry);
    }
}

// const script_result = await Promise.all(
//     value.map(async (entry, index) => {
//         const script_code = Build.get_entrypoint_code(entry.doc, entry.layout, entry.page);
//         const gen_root = join(this.cwd, 'gen', 'js');
//         fs.mkdirSync(gen_root, { recursive: true });
//         fs.writeFileSync(join(gen_root, `${entry.name}.svelte`), script_code);
//         const input_file = join(gen_root, `${entry.name}.js`);
//         fs.writeFileSync(
//             input_file,
//             `
//     import * as App from './${entry.name}.svelte';

//     const app = new App({
//       target: document.body,
//       props: {
//       },
//     });

//     window.getGlobal = (string, fallback) => {
//         return fallback;
//     }

//     export default app;
//     `
//         );
//         const input_options = {
//             input: input_file,
//             plugins: [
//                 svelte({
//                     include: ['gen/js/**/*.svelte', 'src/components/*.svelte'],
//                     emitCss: false,
//                     compilerOptions: {
//                         // By default, the client-side compiler is used. You
//                         // can also use the server-side rendering compiler
//                         generate: 'dom',

//                         // ensure that extra attributes are added to head
//                         // elements for hydration (used with generate: 'ssr')
//                         hydratable: true,
//                     },
//                 }),
//                 alias({
//                     entries: [{ find: '@src', replacement: resolve('src') }],
//                 }),
//                 node_resolve({ browser: true }),
//                 commonjs(),
//                 css({ output: 'gen/default.css' }),
//             ],
//         };
//         const output_options: any = {
//             file: `gen/${entry.name}.js`,
//             sourcemap: true,
//             format: 'iife',
//             name: 'app',
//         };
//         try {
//             const bundle = await rollup.rollup(input_options);
//             const { output } = await bundle.generate(output_options);
//             await bundle.write(output_options);
//         } catch (e) {
//             // svelte error messages
//             WorkerHelper.log(LogType.error, '[svelte]', input_file, e);
//         }
//         return true;
//     })
// );
