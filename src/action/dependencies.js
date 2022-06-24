import { join } from 'path';
import { FOLDER_GEN_SRC } from '../constants/folder.js';
import { WorkerAction } from '../struc/worker_action.js';
import { get_name, WorkerEmit } from '../struc/worker_emit.js';
import { Event } from '../utils/event.js';
import { collect_svelte_files } from '../utils/file.js';
import { Logger } from '../utils/logger.js';
import { is_array, is_null } from '../utils/validate.js';
import { Cwd } from '../vars/cwd.js';
import { worker_action } from './worker_action.js';

export async function dependencies() {
    const name = 'dependencies';

    const dependency_name = get_name(WorkerEmit.dependencies);
    const dependencies = {};
    const listener_id = Event.on('emit', dependency_name, (data) => {
        const deps = data?.dependencies;
        if (!is_null(deps)) {
            Object.keys(deps).forEach((file) => {
                if (!is_array(dependencies[file])) {
                    dependencies[file] = [];
                }
                dependencies[file].push(...deps[file]);
            });
        }
    });

    await worker_action(name, WorkerAction.dependencies, 10, async () => {
        return collect_svelte_files(join(Cwd.get(), FOLDER_GEN_SRC)).map((file) => file.path);
    });

    Event.off('emit', dependency_name, listener_id);

    Logger.info('dependencies', dependencies);
}
