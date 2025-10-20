import { PLUGIN_SCRIPTS } from '../constants/plugins.js';
import { WorkerAction } from '../struc/worker_action.js';
import { Plugin } from '../utils/plugin.js';
import { WorkerController } from '../worker/controller.js';
import { measure_action } from './helper.js';

export async function scripts(identifier, minimize_output) {
    const name = 'scripts';

    await measure_action(
        name,
        async () => {
            const data = Object.keys(identifier).map((key) => identifier[key]);

            // wrap in plugin
            const caller = await Plugin.process(PLUGIN_SCRIPTS, data);
            await caller(async (data) => {
                await WorkerController.process_in_workers(WorkerAction.scripts, data, 1, true);
            });
        },
        minimize_output
    );
}
