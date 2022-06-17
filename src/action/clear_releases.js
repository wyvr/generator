import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import { FOLDER_RELEASES } from '../constants/folder.js';
import { remove } from '../utils/file.js';
import { Logger } from '../utils/logger.js';
import { Cwd } from '../vars/cwd.js';

export function clear_releases(keep, ignore_id) {
    const path = join(Cwd.get(), FOLDER_RELEASES);
    const releases = readdirSync(path).filter((release) => release != ignore_id);
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
}