import { FOLDER_ASSETS } from '../constants/folder.js';
import { STORAGE_OPTIMIZE_HASHES } from '../constants/storage.js';
import { WorkerAction } from '../struc/worker_action.js';
import { KeyValue } from '../utils/database/key_value.js';
import { collect_files } from '../utils/file.js';
import { get_files_hashes } from '../utils/hash.js';
import { Plugin } from '../utils/plugin.js';
import { Env } from '../vars/env.js';
import { ReleasePath } from '../vars/release_path.js';
import { WorkerController } from '../worker/controller.js';
import { measure_action } from './helper.js';

export async function optimize_assets() {
    // optimize is only active in production mode
    if (Env.is_dev()) {
        return;
    }
    const name = 'optimize assets';
    await measure_action(name, async () => {
        // optimize files in the assets folder
        const files = collect_files(ReleasePath.get(FOLDER_ASSETS));
        const optimize_files = files.filter((file) => file.match(/\.(html|htm|css|[mc]?js)$/));
        const hashes = get_files_hashes(files.filter((file) => file.match(/\.(css|[mc]?js)$/)));
        const hashes_db = new KeyValue(STORAGE_OPTIMIZE_HASHES);
        hashes_db.setObject(hashes);
        hashes_db.close();

        // wrap in plugin
        const caller = await Plugin.process(name, optimize_files);
        await caller(async (files) => {
            await WorkerController.process_in_workers(WorkerAction.optimize, files, 10);
        });
    });
}