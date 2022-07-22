import { FOLDER_GEN_SRC } from '../constants/folder.js';
import { WorkerAction } from '../struc/worker_action.js';
import { get_name, WorkerEmit } from '../struc/worker_emit.js';
import { set_config_cache } from '../utils/config_cache.js';
import { Event } from '../utils/event.js';
import { collect_files } from '../utils/file.js';
import { Plugin } from '../utils/plugin.js';
import { is_null, match_interface } from '../utils/validate.js';
import { Cwd } from '../vars/cwd.js';
import { WorkerController } from '../worker/controller.js';
import { measure_action } from './helper.js';

export async function transform() {
    const name = 'transform';

    await measure_action(name, async () => {
        const data = collect_files(Cwd.get(FOLDER_GEN_SRC));
        const identifier_name = get_name(WorkerEmit.wyvr_config);
        const file_configs = {};

        // wrap in plugin
        const caller = await Plugin.process(name, data);
        await caller(async (data) => {
            const listener_id = Event.on('emit', identifier_name, (data) => {
                if (is_null(data) || !match_interface(data, { file: true, config: true })) {
                    return;
                }
                file_configs[data.file] = data.config;
            });

            await WorkerController.process_in_workers(WorkerAction.transform, data, 10);

            // remove listeners
            Event.off('emit', identifier_name, listener_id);
        });

        set_config_cache('dependencies.config', file_configs);
    });
}
