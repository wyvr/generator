import { join } from 'path';
import { FOLDER_PUBLISH } from '../constants/folder.js';
import { Config } from '../utils/config.js';
import { remove, symlink } from '../utils/file.js';
import { Logger } from '../utils/logger.js';
import { Plugin } from '../utils/plugin.js';
import { Cwd } from '../vars/cwd.js';
import { ReleasePath } from '../vars/release_path.js';
import { UniqId } from '../vars/uniq_id.js';
import { clear_releases } from './clear_releases.js';
import { measure_action } from './helper.js';

export async function publish() {
    const name = 'publish';

    await measure_action(name, async () => {
        const build_id = UniqId.get();
        const release_path = ReleasePath.get();
        const keep = Config.get('releases.keep', 0);

        // wrap in plugin
        const caller = await Plugin.process(name, build_id, release_path);
        await caller(async () => {
            const pub = join(Cwd.get(), FOLDER_PUBLISH);
            remove(pub);
            symlink(release_path, pub);
        });

        Logger.info('published', build_id);

        await clear_releases(keep, build_id);
    });
}
