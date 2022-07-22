import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import { FOLDER_RELEASES } from '../constants/folder.js';
import { Config } from '../utils/config.js';
import { remove } from '../utils/file.js';
import { Logger } from '../utils/logger.js';
import { Plugin } from '../utils/plugin.js';
import { Cwd } from '../vars/cwd.js';
import { measure_action } from './helper.js';

export async function clear_releases(ignore_id) {
    const name = 'clear_releases';
    const keep = Config.get('releases.keep', 0);

    await measure_action(name, async () => {
        const path = Cwd.get(FOLDER_RELEASES);
        const releases = readdirSync(path).filter((release) => release != ignore_id);
        await Plugin.before(name, releases, keep, ignore_id);

        const delete_releases = releases
            .map((release) => {
                const { ctime } = statSync(join('releases', release), { bigint: true });
                return { ctime, release };
            })
            .sort((a, b) => b.ctime.getTime() - a.ctime.getTime())
            .slice(keep)
            .map((entry) => {
                remove(join(path, entry.release));
                return entry.release;
            });

        await Plugin.after(name, delete_releases);

        Logger.info('keep', keep, 'releases');
        const amount = delete_releases.length;
        if (amount > 0) {
            Logger.info(
                'deleted',
                amount,
                amount == 1 ? 'release' : 'releases',
                Logger.color.dim(delete_releases.join(','))
            );
            return;
        }
        Logger.info('no releases will be deleted');
    });
}
