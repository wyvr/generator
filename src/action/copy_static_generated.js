import { join } from 'path';
import { FOLDER_ASSETS, FOLDER_CSS, FOLDER_GEN, FOLDER_JS } from '../constants/folder.js';
import { Plugin } from '../utils/plugin.js';
import { Cwd } from '../vars/cwd.js';
import { ReleasePath } from '../vars/release_path.js';
import { copy_folder } from './copy.js';
import { measure_action } from './helper.js';

export async function copy_static_generated() {
    const name = 'copy';

    await measure_action(name, async () => {
        // wrap in plugin
        const caller = await Plugin.process(name);
        await caller(async () => {
            copy_folder(join(Cwd.get(), FOLDER_GEN), [FOLDER_ASSETS, FOLDER_CSS, FOLDER_JS], ReleasePath.get());
        });
    });
}
