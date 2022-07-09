import { WorkerAction } from '../struc/worker_action.js';
import { collect_files } from '../utils/file.js';
import { Plugin } from '../utils/plugin.js';
import { Env } from '../vars/env.js';
import { ReleasePath } from '../vars/release_path.js';
import { WorkerController } from '../worker/controller.js';
import { measure_action } from './helper.js';

export async function optimize() {
    // optimize is only active in production mode
    if (Env.is_dev()) {
        return;
    }
    const name = 'optimize';
    await measure_action(name, async () => {
        const files = collect_files(ReleasePath.get()).filter((file) => file.match(/\.(html|htm|css)$/));

        // wrap in plugin
        const caller = await Plugin.process(name, files);
        await caller(async (files) => {
            await WorkerController.process_in_workers(WorkerAction.optimize, files, 10);
        });
    });
}
