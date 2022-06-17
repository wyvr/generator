import { join } from 'path';
import { FOLDER_PUBLISH } from '../constants/folder.js';
import { Config } from '../utils/config.js';
import { nano_to_milli } from '../utils/convert.js';
import { remove, symlink } from '../utils/file.js';
import { Logger } from '../utils/logger.js';
import { Plugin } from '../utils/plugin.js';
import { Cwd } from '../vars/cwd.js';
import { ReleasePath } from '../vars/release_path.js';
import { UniqId } from '../vars/uniq_id.js';
import { sleep } from '../worker_action/sleep.js';
import { clear_releases } from './clear_releases.js';

export async function publish() {
    const name = 'publish';
    const start = process.hrtime.bigint();
    Logger.start(name);

    const build_id = UniqId.get();
    const release_path = ReleasePath.get();
    const keep = Config.get('releases.keep', 0);

    await Plugin.before(name, build_id, release_path);

    const pub = join(Cwd.get(), FOLDER_PUBLISH);
    remove(pub);
    symlink(release_path, pub);

    await Plugin.after(name, build_id, release_path);

    Logger.info('published', build_id);

    await clear_releases(keep, build_id);
    
    Logger.stop(name, nano_to_milli(process.hrtime.bigint() - start));
}
