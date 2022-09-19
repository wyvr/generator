import { WorkerAction } from '../struc/worker_action.js';
import { Plugin } from '../utils/plugin.js';
import { WorkerController } from '../worker/controller.js';
import { measure_action } from './helper.js';

export async function media(files, minimize_output) {
    const name = 'media';
    const media_files = Object.values(files);

    await measure_action(
        name,
        async () => {
            // wrap in plugin
            const caller = await Plugin.process(name, media_files);
            await caller(async (files) => {
                await WorkerController.process_in_workers(WorkerAction.media, files, 10);
            });
        },
        minimize_output
    );
}
