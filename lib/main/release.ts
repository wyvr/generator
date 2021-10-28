import { fail } from '@lib/helper/endings';
import { Plugin } from '@lib/plugin';
import { Publish } from '@lib/publish';
import { IPerformance_Measure } from '@lib/performance_measure';
import { UniqId } from '../vars/uniq_id';

export const release = async (perf: IPerformance_Measure) => {
    perf.start('release');
    const [error_before] = await Plugin.before('release');
    if (error_before) {
        fail(error_before);
    }
    Publish.release(UniqId.get());
    const [error_after] = await Plugin.after('release');
    if (error_after) {
        fail(error_after);
    }
    perf.end('release');
};
