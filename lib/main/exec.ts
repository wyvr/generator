import { Plugin } from '@lib/plugin';
import { File } from '@lib/file';
import { join } from 'path';
import { fail } from '../helper/endings';
import { Exec } from '../exec';
import { IPerformance_Measure } from '../performance_measure';

export const exec = async (perf: IPerformance_Measure) => {
    perf.start('exec');
    const exec_files = File.collect_files(join('gen', 'exec'), '.js');
    /* eslint-disable @typescript-eslint/no-unused-vars */
    const [err_before, config_before, list_before] = await Plugin.before('exec', exec_files);
    /* eslint-enable @typescript-eslint/no-unused-vars */
    if (err_before) {
        fail(err_before);
        return;
    }
    const list = Exec.init(list_before);
    /* eslint-disable @typescript-eslint/no-unused-vars */
    const [err_after, config_after, list_after] = await Plugin.after('exec', list);
    /* eslint-enable */
    if (err_after) {
        fail(err_after);
    }
    perf.end('exec');
    return list_after;
};
