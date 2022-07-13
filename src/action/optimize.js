import { WorkerAction } from '../struc/worker_action.js';
import { collect_files } from '../utils/file.js';
import { get_files_hashes } from '../utils/hash.js';
import { Plugin } from '../utils/plugin.js';
import { Env } from '../vars/env.js';
import { ReleasePath } from '../vars/release_path.js';
import { WorkerController } from '../worker/controller.js';
import { measure_action } from './helper.js';

export async function optimize(media_query_files, critical) {
    // optimize is only active in production mode
    if (Env.is_dev()) {
        return;
    }
    const name = 'optimize';
    await measure_action(name, async () => {
        const files = collect_files(ReleasePath.get());
        const optimize_files = files.filter((file) => file.match(/\.(html|htm|css|[mc]?js)$/));
        const hashes = get_files_hashes(files.filter((file) => file.match(/\.(css|[mc]?js)$/)));
        WorkerController.set_all_workers('hashes', hashes);
        WorkerController.set_all_workers('media_query_files', media_query_files);
        WorkerController.set_all_workers('critical', critical);
        // wrap in plugin
        const caller = await Plugin.process(name, optimize_files);
        await caller(async (files) => {
            await WorkerController.process_in_workers(WorkerAction.optimize, files, 10);
        });
        WorkerController.set_all_workers('hashes', undefined);
        WorkerController.set_all_workers('media_query_files', undefined);
        WorkerController.set_all_workers('critical', undefined);
    });
}
