import { FOLDER_PUBLISH } from '../constants/folder.js';
import { symlink } from '../utils/file.js';
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

        // wrap in plugin
        const caller = await Plugin.process(name, build_id, release_path);
        await caller(async () => {
            const pub = Cwd.get(FOLDER_PUBLISH);
            const created = symlink(release_path, pub);
            if (!created) {
                process.exit(1);
            }
        });

        Logger.info('published', build_id);
    });

    await cronjobs('publish');
}
