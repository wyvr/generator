import { FOLDER_GEN } from '../constants/folder.js';
import { Plugin } from '../utils/plugin.js';
import { filled_array } from '../utils/validate.js';
import { Cwd } from '../vars/cwd.js';
import { ReleasePath } from '../vars/release_path.js';
import { copy_folder } from './copy.js';
import { measure_action } from './helper.js';

export async function copy_static_generated(folders) {
    const name = 'copy generated';

    if (!filled_array(folders)) {
        return;
    }

    await measure_action(name, async () => {
        // wrap in plugin
        const caller = await Plugin.process(name);
        await caller(async () => {
            copy_folder(Cwd.get(FOLDER_GEN), folders, ReleasePath.get());
        });
    });
}
