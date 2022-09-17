import { extname, join } from 'path';
import { FOLDER_DEVTOOLS, FOLDER_GEN } from '../constants/folder.js';
import { compile_svelte_from_code } from '../utils/compile_svelte.js';
import { collect_files, read, remove, to_extension, write, write_json } from '../utils/file.js';
import { Plugin } from '../utils/plugin.js';
import { build } from '../utils/build.js';
import { Cwd } from '../vars/cwd.js';
import { Env } from '../vars/env.js';
import { ReleasePath } from '../vars/release_path.js';
import { copy_folder } from './copy.js';
import { measure_action } from './helper.js';
import { filled_string } from '../utils/validate.js';

export async function wyvr_internal() {
    const name = 'wyvr_internal';

    if (Env.is_dev()) {
        await measure_action(name, async () => {
            // wrap in plugin
            const caller = await Plugin.process(name);
            await caller(async () => {
                await build_wyvr_internal();
            });
        });
    }
}

export async function build_wyvr_internal() {
    copy_folder(Cwd.get(FOLDER_GEN), [FOLDER_DEVTOOLS], ReleasePath.get());
    const folder = join(ReleasePath.get(), FOLDER_DEVTOOLS);
    // create file of all available debug modules
    const devtools_modules = collect_files(folder, '.mjs')
        .map((file) => {
            if (file.indexOf('svelte.mjs') > -1) {
                return false;
            }
            write(file, replace_svelte_paths(read(file), folder));
            return file;
        })
        .filter((x) => x)
        .map((file) => file.replace(ReleasePath.get(), ''));
    const modules_file = join(folder, 'modules.json');
    remove(modules_file);
    write_json(modules_file, devtools_modules);
    // compile svelte components
    await Promise.all(
        collect_files(folder, '.svelte').map(async (file) => {
            const prepared_content = replace_svelte_paths(replace_file_paths(read(file), folder));
            const result = await compile_svelte_from_code(prepared_content, file, 'client', true);
            if (!result?.js?.code) {
                return undefined;
            }
            const filename = to_extension(file, 'svelte.mjs');
            const module = await build(result.js.code, filename, 'esm');

            write(filename, module.code);
            return result;
        })
    );
}

export function replace_svelte_paths(content) {
    if (!filled_string(content)) {
        return '';
    }
    return content.replace(/from ['"]\.\/([^'"]+)['"]/g, (_, path) => {
        if (extname(path) === '.svelte') {
            path = to_extension(path, 'svelte.mjs');
        }
        return `from './${path}'`;
    });
}

export function replace_file_paths(content, folder) {
    if (!filled_string(content)) {
        return '';
    }
    if (!filled_string(folder)) {
        return content;
    }
    return content.replace(/from ['"]\.\/([^'"]+)['"]/g, `from '${folder}/$1'`);
}
