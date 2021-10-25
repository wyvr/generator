import { Logger } from '../logger';
import { WorkerAction } from '../model/worker/action';
import { WorkerEmit } from '../model/worker/emit';
import { Plugin } from '../plugin';
import { WorkerController } from '../worker/controller';

export const build_files = async (
    worker_controller: WorkerController,
    list: string[],
    watched_json_files: string[] = [],
    changed_files: { event: string; path: string; rel_path: string }[] = null,
    identifier_list: any[] = null
) => {
    // match exactly against the json files
    const filtered_list = list.filter((entry) => {
        return watched_json_files.find((file) => entry == file);
    });
    // build only the matching datasets
    const [pages, identifier_data_list] = await build_list(worker_controller, filtered_list);
    return [pages, identifier_data_list];
};

export const build_list = async (worker_controller: WorkerController, list: string[]) => {
    Logger.debug('build list', list);
    const [error_list, config, modified_list] = await Plugin.before('build', list);
    Logger.debug('build', modified_list.length, `${modified_list.length == 1 ? 'dataset' : 'datasets'}`);
    const pages = [];
    const identifier_data_list = [];
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

    const result = await worker_controller.process_in_workers('build', WorkerAction.build, modified_list, 100);
    worker_controller.events.off('emit', WorkerEmit.build, on_build_index);
    worker_controller.events.off('emit', WorkerEmit.identifier_list, on_identifier_index);
    await Plugin.after('build', result, pages);
    return [pages, identifier_data_list];
};
