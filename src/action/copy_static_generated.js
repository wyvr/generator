import { join } from 'node:path';
import { FOLDER_ASSETS, FOLDER_CSS, FOLDER_GEN, FOLDER_I18N, FOLDER_JS, FOLDER_PROP } from '../constants/folder.js';
import { exists, symlink } from '../utils/file.js';
import { Plugin } from '../utils/plugin.js';
import { Cwd } from '../vars/cwd.js';
import { ReleasePath } from '../vars/release_path.js';
import { copy_folder } from './copy.js';
import { measure_action } from './helper.js';

export async function copy_static_generated() {
    const name = 'copy generated';

    await measure_action(name, async () => {
        // wrap in plugin
        const caller = await Plugin.process(name);
        await caller(async () => {
            copy_folder(Cwd.get(FOLDER_GEN), [FOLDER_ASSETS, FOLDER_CSS, FOLDER_JS, FOLDER_I18N, FOLDER_PROP], ReleasePath.get());
        });
        // symlink special files like favicon.ico
        const favicon_ico = join(ReleasePath.get(), FOLDER_ASSETS, 'favicon.ico');
        if (exists(favicon_ico)) {
            symlink(favicon_ico, join(ReleasePath.get(), 'favicon.ico'));
        }
    });
}
