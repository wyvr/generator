import { Logger } from '@lib/logger';
import { WorkerAction } from '@lib/struc/worker/action';
import { WorkerEmit } from '@lib/struc/worker/emit';
import { Plugin } from '@lib/plugin';
import { WorkerController } from '@lib/worker/controller';
import { IBuildFileResult } from '@lib/interface/build';
import { IIdentifier } from '@lib/interface/identifier';

export const build_files = async (worker_controller: WorkerController, list: string[], watched_json_files: string[] = []): Promise<[string[][], IBuildFileResult[], IIdentifier[]]> => {
    // match exactly against the json files
    const filtered_list = list.filter((entry) => {
        return watched_json_files.find((file) => entry == file);
    });
    // build only the matching datasets
    const result = await build_list(worker_controller, filtered_list);
    
    return result;
};

export const build_list = async (worker_controller: WorkerController, list: string[]): Promise<[string[][], IBuildFileResult[], IIdentifier[]]> => {
    Logger.debug('build list', list);
    /* eslint-disable */
    const [error_list, config, modified_list] = await Plugin.before('build', list);
    /* eslint-enable */
    Logger.debug('build', modified_list.length, `${modified_list.length == 1 ? 'dataset' : 'datasets'}`);
    const pages = [];
    const identifier_data_list = [];
    const errors_list = [];
    const on_build_index = worker_controller.events.on('emit', WorkerEmit.build, (data) => {
        // add the results to the build file list
        if (data) {
            // console.log('build result', data.data);
            pages.push(...data.data.filter((x) => x));
        }
    });
    const on_identifier_index = worker_controller.events.on('emit', WorkerEmit.identifier_list, (data) => {
        // add the results to the build file list
        if (data && data.data) {
            // console.log('emit identifier_list', data.data);
            if (Array.isArray(data.data)) {
                identifier_data_list.push(...data.data);
                return;
            }
            identifier_data_list.push(data.data);
        }
    });
    const on_error_index = worker_controller.events.on('emit', WorkerEmit.errors, (data) => {
        // add the errors to the error list
        if (data && data.data) {
            if (Array.isArray(data.data)) {
                errors_list.push(...data.data);
                return;
            }
            errors_list.push(data.data);
        }
    });

    const result = await worker_controller.process_in_workers('build', WorkerAction.build, modified_list, 100);
    worker_controller.events.off('emit', WorkerEmit.build, on_build_index);
    worker_controller.events.off('emit', WorkerEmit.identifier_list, on_identifier_index);
    worker_controller.events.off('emit', WorkerEmit.identifier_list, on_error_index);
    await Plugin.after('build', result, pages);
    const result_errors = errors_list.length == 0 ? undefined : errors_list;
    return [result_errors, pages, identifier_data_list];
};
