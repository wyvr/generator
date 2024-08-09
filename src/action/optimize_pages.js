import { FOLDER_ASSETS } from '../constants/folder.js';
import { STORAGE_OPTIMIZE_HASHES } from '../constants/storage.js';
import { WorkerAction } from '../struc/worker_action.js';
import { KeyValue } from '../utils/database/key_value.js';
import { collect_files, read, write } from '../utils/file.js';
import { get_files_hashes } from '../utils/hash.js';
import { replace_files_with_content_hash } from '../utils/optimize.js';
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
            await WorkerController.process_in_workers(
                WorkerAction.optimize,
                pages,
                10
            );
        });
    });
}
