import { join } from 'path';
import { FOLDER_GEN_SRC } from '../constants/folder.js';
import { WorkerAction } from '../struc/worker_action.js';
import { nano_to_milli } from '../utils/convert.js';
import { collect_files } from '../utils/file.js';
import { Logger } from '../utils/logger.js';
import { Plugin } from '../utils/plugin.js';
import { Cwd } from '../vars/cwd.js';
import { WorkerController } from '../worker/controller.js';
import { wait_until_idle } from './wait_until_idle.js';

export async function transform() {
    // wait until all workers are ready
    await wait_until_idle(30);

    const name = 'transform';
    const start = process.hrtime.bigint();
    Logger.start(name);

    const files = collect_files(join(Cwd.get(), FOLDER_GEN_SRC));

    await Plugin.before(name, files);

    await WorkerController.process_in_workers(WorkerAction.transform, files, 10);

    await Plugin.after(name, files);

    Logger.stop(name, nano_to_milli(process.hrtime.bigint() - start));
}
