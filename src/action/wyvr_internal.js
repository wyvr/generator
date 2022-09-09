import { join } from 'path';
import {
    FOLDER_ASSETS,
    FOLDER_CSS,
    FOLDER_GEN,
    FOLDER_I18N,
    FOLDER_JS,
    FOLDER_PROP,
    FOLDER_WYVR,
} from '../constants/folder.js';
import { compile_svelte_from_code } from '../utils/compile_svelte.js';
import { collect_files, read, remove, to_extension, write, write_json } from '../utils/file.js';
import { Plugin } from '../utils/plugin.js';
import { build } from '../utils/build.js';
import { Cwd } from '../vars/cwd.js';
import { Env } from '../vars/env.js';
import { ReleasePath } from '../vars/release_path.js';
import { copy_folder } from './copy.js';
import { measure_action } from './helper.js';

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
    copy_folder(Cwd.get(FOLDER_GEN), [FOLDER_WYVR], ReleasePath.get());
    // create file of all available debug modules
    const debug_modules = collect_files(join(ReleasePath.get(), FOLDER_WYVR, 'debug'), '.mjs')
        .map((file) => {
            if (file.indexOf('svelte.mjs') > -1) {
                return false;
            }
            return file.replace(ReleasePath.get(), '');
        })
        .filter((x) => x);
    const modules_file = join(ReleasePath.get(), FOLDER_WYVR, 'debug', 'modules.json');
    remove(modules_file);
    write_json(modules_file, debug_modules);
    // compile svelte components
    await Promise.all(
        collect_files(join(ReleasePath.get(), FOLDER_WYVR, 'debug'), '.svelte').map(async (file) => {
            const result = await compile_svelte_from_code(read(file), file, 'client', true);
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
