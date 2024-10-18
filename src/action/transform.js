import { FOLDER_GEN_SRC } from '../constants/folder.js';
import { PLUGIN_TRANSFORM } from '../constants/plugins.js';
import { WorkerAction } from '../struc/worker_action.js';
import { get_name, WorkerEmit } from '../struc/worker_emit.js';
import { Event } from '../utils/event.js';
import { collect_files } from '../utils/file.js';
import { Plugin } from '../utils/plugin.js';
import { is_array } from '../utils/validate.js';
import { Cwd } from '../vars/cwd.js';
import { WorkerController } from '../worker/controller.js';
import { measure_action } from './helper.js';

export async function transform(data, minimize_output = false) {
    const name = 'transform';
    const errors_name = get_name(WorkerEmit.errors);

    await measure_action(
        name,
        async () => {
            if (!is_array(data)) {
                data = collect_files(Cwd.get(FOLDER_GEN_SRC));
            }

            const errors_id = Event.on('emit', errors_name, (data) => {
                if (!data || !data.errors) {
                    return;
                }
                Logger.error('terminated because of transform errors');
                terminate(true);
            });

            // wrap in plugin
            const caller = await Plugin.process(PLUGIN_TRANSFORM, data);
            await caller(async (data) => {
                await WorkerController.process_in_workers(WorkerAction.transform, data, 10, minimize_output);
            });
            // remove listeners
            Event.off('emit', errors_name, errors_id);
        },
        minimize_output
    );
}
