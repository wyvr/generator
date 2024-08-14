import { FOLDER_GEN_SRC } from '../constants/folder.js';
import { WorkerAction } from '../struc/worker_action.js';
import { get_name, WorkerEmit } from '../struc/worker_emit.js';
import { set_config_cache } from '../utils/config_cache.js';
import { Event } from '../utils/event.js';
import { collect_files } from '../utils/file.js';
import { Plugin } from '../utils/plugin.js';
import { sleep } from '../utils/sleep.js';
import { is_array, is_null, is_object, match_interface } from '../utils/validate.js';
import { Cwd } from '../vars/cwd.js';
import { WorkerController } from '../worker/controller.js';
import { measure_action } from './helper.js';

export async function transform(data, file_configs = {}, minimize_output = false) {
    const name = 'transform';
    const errors_name = get_name(WorkerEmit.errors);

    await measure_action(
        name,
        async () => {
            if (!is_array(data)) {
                data = collect_files(Cwd.get(FOLDER_GEN_SRC));
            }
            if (!is_object(file_configs)) {
                file_configs = {};
            }
            const config_name = get_name(WorkerEmit.wyvr_config);

            // add listeners
            const config_id = Event.on('emit', config_name, (data) => {
                if (is_null(data) || !match_interface(data, { file: true, config: true })) {
                    return;
                }
                file_configs[data.file] = data.config;
            });

            const errors_id = Event.on('emit', errors_name, (data) => {
                if (!data || !data.errors) {
                    return;
                }
                Logger.error('terminated because of transform errors');
                terminate(true);
            });

            // wrap in plugin
            const caller = await Plugin.process(name, data);
            await caller(async (data) => {
                await WorkerController.process_in_workers(WorkerAction.transform, data, 10, minimize_output);
            });
            // remove listeners
            Event.off('emit', config_name, config_id);
            Event.off('emit', errors_name, errors_id);

            await set_config_cache('dependencies.config', file_configs);
        },
        minimize_output
    );
}
