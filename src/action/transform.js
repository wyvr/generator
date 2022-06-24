import { join } from 'path';
import { FOLDER_GEN_SRC } from '../constants/folder.js';
import { WorkerAction } from '../struc/worker_action.js';
import { collect_files } from '../utils/file.js';
import { Plugin } from '../utils/plugin.js';
import { Cwd } from '../vars/cwd.js';
import { WorkerController } from '../worker/controller.js';
import { measure_action } from './helper.js';

export async function transform() {
    const name = 'transform';

    await measure_action(name, async () => {
        const data = collect_files(join(Cwd.get(), FOLDER_GEN_SRC));

        // wrap in plugin
        const caller = await Plugin.process(name, data);
        await caller(async (data) => {
            await WorkerController.process_in_workers(WorkerAction.transform, data, 10);
        });
    });
}
