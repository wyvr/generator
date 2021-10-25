import { Config } from '@lib/config';
import { Dir } from '@lib/dir';
import { Logger } from '@lib/logger';
import { WyvrMode } from '@lib/model/wyvr/mode';
import { IPerformance_Measure } from '@lib/performance_measure';
import { Publish } from '@lib/publish';

export const cleanup = async (perf: IPerformance_Measure, release_path: string, mode: WyvrMode) => {
    perf.start('cleanup');
    const keep = Config.get('releases.keep') ?? 0;
    // remove old releases
    if (mode == WyvrMode.build) {
        // delete old releases on new build
        Dir.create('releases');
        const deleted_releases = Publish.cleanup(keep);
        Logger.info(`keep ${keep} release(s), deleted ${deleted_releases.length}`);
    }
    Dir.create(release_path);
    perf.end('cleanup');
};
