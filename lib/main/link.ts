import { fail } from '@lib/helper/endings';
import { Link } from '@lib/link';
import { Plugin } from '@lib/plugin';
import { IPerformance_Measure } from '@lib/performance_measure';
import { UniqId } from '@lib/vars/uniq_id';

export const link = async (perf: IPerformance_Measure) => {
    perf.start('link');
    const [error_before] = await Plugin.before('link');
    if (error_before) {
        fail(error_before);
    }
    const static_folders = ['assets', 'js', 'css', 'i18n'];
    // symlink the "static" folders to release
    static_folders.forEach((folder) => {
        Link.to(`gen/${folder}`, `releases/${UniqId.get()}/${folder}`);
    });

    // link media cache
    Link.to(`cache/media`, `releases/${UniqId.get()}/media`);

    const [error_after] = await Plugin.after('link');
    if (error_after) {
        fail(error_after);
    }
    perf.end('link');
};
