import { readdirSync, statSync, existsSync, readlinkSync, removeSync } from 'fs-extra';
import { join } from 'path';
import { Link } from '@lib/link';

export class Publish {
    static cleanup(keep: number = 0) {
        let pub_release = null;

        // when pub exists and links to a release avoid deleting this release
        if (existsSync('pub')) {
            const pub = statSync('pub');
            if (pub && pub.isSymbolicLink()) {
                pub_release = readlinkSync('pub');
            }
        }
        const releases_to_delete = readdirSync('releases')
            .map((release) => {
                const { ctime } = statSync(join('releases', release), { bigint: true });
                return { ctime, release };
            })
            .sort((a, b) => b.ctime.getTime() - a.ctime.getTime())
            .filter((entry) => !pub_release || pub_release.indexOf(entry.release) == -1)
            .slice(keep)
            .map((entry) => {
                removeSync(join('releases', entry.release));
                return entry;
            });

        return releases_to_delete;
    }
    static release(release: string) {
        const release_path = join('releases', release);
        if (existsSync(release_path)) {
            Link.to(release_path, 'pub');
        }
    }
}
