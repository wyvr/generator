import { FOLDER_ASSETS, FOLDER_PUBLISH } from '../constants/folder.js';
import { PLUGIN_PUBLISH } from '../constants/plugins.js';
import { exists, symlink } from '../utils/file.js';
import { Logger } from '../utils/logger.js';
import { Plugin } from '../utils/plugin.js';
import { Cwd } from '../vars/cwd.js';
import { ReleasePath } from '../vars/release_path.js';
import { UniqId } from '../vars/uniq_id.js';
import { cronjobs } from './cronjobs.js';
import { measure_action } from './helper.js';

export async function publish() {
    const name = 'publish';

    await measure_action(name, async () => {
        const build_id = UniqId.get();
        const release_path = ReleasePath.get();

        // symlink special files like favicon.ico
        const favicon_ico = ReleasePath.get(FOLDER_ASSETS, 'favicon.ico');
        if (exists(favicon_ico)) {
            symlink(favicon_ico, ReleasePath.get('favicon.ico'));
        }

        // wrap in plugin
        const caller = await Plugin.process(PLUGIN_PUBLISH, {
            build_id,
            release_path,
            pub: Cwd.get(FOLDER_PUBLISH)
        });
        await caller(async ({ release_path, pub }) => {
            const created = symlink(release_path, pub);
            if (!created) {
                process.exit(1);
            }
        });

        Logger.info('published', build_id);
    });

    await cronjobs('publish');
}
