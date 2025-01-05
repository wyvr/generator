import { dirname, extname, join } from 'node:path';
import { FOLDER_DEVTOOLS, FOLDER_GEN } from '../constants/folder.js';
import { compile_svelte_from_code } from '../utils/compile_svelte.js';
import { collect_files, read, remove, to_extension, write, write_json } from '../utils/file.js';
import { Plugin } from '../utils/plugin.js';
import { build } from '../utils/build.js';
import { Cwd } from '../vars/cwd.js';
import { Env } from '../vars/env.js';
import { ReleasePath } from '../vars/release_path.js';
import { copy_folder } from './copy.js';
import { filled_string } from '../utils/validate.js';
import { PLUGIN_INTERNAL } from '../constants/plugins.js';

export async function wyvr_internal() {
    if (!Env.is_dev()) {
        return;
    }
    // wrap in plugin
    const caller = await Plugin.process(PLUGIN_INTERNAL, [FOLDER_DEVTOOLS]);
    await caller(async (folders) => {
        copy_folder(Cwd.get(FOLDER_GEN), folders, ReleasePath.get());
    });
    await build_devtools();

}

export async function build_devtools() {
    const folder = ReleasePath.get(FOLDER_DEVTOOLS);
    const files = collect_files(folder);

    // @TODO process in the workers
    const devtools_modules = await Promise.all(
        files.map(async (file) => {
            // ignore compiled svelte files
            if (file.match(/\.svelte\.[m]?js$/)) {
                return undefined;
            }

            const content = read(file);
            // compile svelte components
            if (file.match(/\.svelte$/)) {
                const svelte_content = replace_file_paths(content, file);
                const result = await compile_svelte_from_code(svelte_content, file, 'client', true);
                if (!result?.js?.code) {
                    return undefined;
                }
                const filename = to_extension(file, 'svelte.js');
                const module = await build(result.js.code, filename, 'esm');

                write(filename, module.code);
                return undefined;
            }
            // ignore none js files
            if (!file.match(/\.[m]?js$/)) {
                return undefined;
            }
            // create file of all available debug modules
            const module_content = replace_svelte_paths(replace_file_paths(content, file), folder);
            write(file, module_content);
            return file.replace(ReleasePath.get(), '');
        })
    );
    const modules_file = join(folder, 'modules.json');
    remove(modules_file);
    write_json(modules_file, devtools_modules.filter(Boolean));
}

export function replace_svelte_paths(content, folder) {
    if (!filled_string(content)) {
        return '';
    }
    return content.replace(/from ['"]([^'"]+)['"]/g, (_, path) => {
        if (extname(path) === '.svelte') {
            path = to_extension(path, 'svelte.js');
        }
        const new_path = `./${path.replace(/^\.\//, '').replace(folder, '').replace(/^\//, '')}`;
        return `from '${new_path}'`;
    });
}

export function replace_file_paths(content, file) {
    if (!filled_string(content)) {
        return '';
    }
    const rel_path = dirname(file);
    return content.replace(/from ['"](\.\/[^'"]+)['"]/g, (_, path) => `from '${join(rel_path, path)}'`);
}
