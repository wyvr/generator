import { join } from 'path';
import { FOLDER_GEN_SRC } from '../constants/folder.js';
import { WorkerAction } from '../struc/worker_action.js';
import { collect_files } from '../utils/file.js';
import { Cwd } from '../vars/cwd.js';
import { worker_action } from './worker_action.js';

export async function transform() {
    const name = 'transform';

    await worker_action(name, WorkerAction.transform, 10, async () => {
        return collect_files(join(Cwd.get(), FOLDER_GEN_SRC));
    });
}
