import { Env } from '@lib/env';
import { Logger } from '@lib/logger';
import { WorkerAction } from '@lib/model/worker/action';
import { Optimize } from '@lib/optimize';
import { Plugin } from '@lib/plugin';
import { WorkerController } from '@lib/worker/controller';
import { fail } from '@lib/helper/endings';
import { IPerformance_Measure } from '@lib/performance_measure';

export const optimize = async (perf: IPerformance_Measure, identifier_list: any[], worker_controller: WorkerController) => {
    perf.start('optimize');
    if (Env.is_dev()) {
        Logger.improve('optimize will not be executed in dev mode');
        perf.end('optimize');
        return;
    }
    // add contenthash to the generated files
    const replace_hash_files = [];
    const [hash_list, file_list] = Optimize.get_hashed_files();
    // replace in the files itself
    Optimize.replace_hashed_files_in_files(file_list, hash_list);
    /* eslint-disable @typescript-eslint/no-unused-vars */
    const [error_before, config_before, identifier_list_before, replace_hash_files_before] = await Plugin.before('optimize', identifier_list, replace_hash_files);
    /* eslint-enable */
    if (error_before) {
        return fail(error_before);
    }
    // create the list of files with there hashed identifier elements css/js
    const indexed = {};
    identifier_list_before.forEach((entry) => {
        if (!indexed[entry.identifier]) {
            indexed[entry.identifier] = entry;
            indexed[entry.identifier].files = [];
            indexed[entry.identifier].hash_list = hash_list;
        }
        indexed[entry.identifier].files.push(entry.path);
    });
    const list = Object.keys(indexed).map((key) => indexed[key]);
    
    const result = await worker_controller.process_in_workers('optimize', WorkerAction.optimize, list, 1);
    
    /* eslint-disable @typescript-eslint/no-unused-vars */
    const [error_after, config_after, list_after] = await Plugin.after('optimize', list);
    /* eslint-enable */
    perf.end('optimize');
    if (error_after) {
        return fail(error_after);
    }
    return result;
};
