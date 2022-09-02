import { join } from 'path';
import { FOLDER_ASSETS, FOLDER_CSS, FOLDER_GEN, FOLDER_I18N, FOLDER_JS, FOLDER_PROP } from '../constants/folder.js';
import { symlink } from '../utils/file.js';
import { Plugin } from '../utils/plugin.js';
import { to_dirname } from '../utils/to.js';
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
            const resouce_dir = join(to_dirname(import.meta.url), '..', 'resource');
            copy_folder(Cwd.get(FOLDER_GEN), [FOLDER_ASSETS, FOLDER_CSS, FOLDER_JS, FOLDER_I18N, FOLDER_PROP], ReleasePath.get());

            symlink(join(resouce_dir, 'debug.css'), join(ReleasePath.get(), 'debug.css'));
        });
    });
}
