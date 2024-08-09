import { WorkerAction } from '../struc/worker_action.js';
import { collect_files } from '../utils/file.js';
import { Plugin } from '../utils/plugin.js';
import { Env } from '../vars/env.js';
import { ReleasePath } from '../vars/release_path.js';
import { WorkerController } from '../worker/controller.js';
import { measure_action } from './helper.js';

export async function optimize_pages() {
    // optimize is only active in production mode
    if (Env.is_dev()) {
        return;
    }
    const name = 'optimize pages';
    await measure_action(name, async () => {
        // optimize files in the assets folder
        const files = collect_files(ReleasePath.get());
        const pages = files.filter((file) => file.match(/\.(html|htm)$/));

        const caller = await Plugin.process(name, pages);
        await caller(async (pages) => {
            await WorkerController.process_in_workers(WorkerAction.optimize, pages, 10);
        });
    });
}
