import { join } from 'path';
import { FOLDER_GEN_SRC } from '../constants/folder.js';
import { WorkerAction } from '../struc/worker_action.js';
import { collect_files } from '../utils/file.js';
import { Cwd } from '../vars/cwd.js';
import { worker_action } from './worker_action.js';

export async function compile() {
    const name = 'compile';
    await worker_action(name, WorkerAction.compile, 10, async () => {
        return collect_files(join(Cwd.get(), FOLDER_GEN_SRC), '.svelte');
    });
}
