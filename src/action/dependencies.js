import { join } from 'path';
import { FOLDER_GEN, FOLDER_GEN_SRC } from '../constants/folder.js';
import { WorkerAction } from '../struc/worker_action.js';
import { get_name, WorkerEmit } from '../struc/worker_emit.js';
import { Config } from '../utils/config.js';
import { flip_dependency_tree } from '../utils/dependency.js';
import { Event } from '../utils/event.js';
import { collect_svelte_files, write_json } from '../utils/file.js';
import { is_array, is_null } from '../utils/validate.js';
import { Cwd } from '../vars/cwd.js';
import { configure } from './configure.js';
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

    // create bottom-top dependency tree
    const inverted_dependencies = flip_dependency_tree(dependencies);
    
    // add to config and write gen files
    Config.set('dependencies.top', dependencies);
    write_json(join(Cwd.get(), FOLDER_GEN, 'dependencies_top.json'), dependencies);
    
    Config.set('dependencies.bottom', inverted_dependencies);
    write_json(join(Cwd.get(), FOLDER_GEN, 'dependencies_bottom.json'), inverted_dependencies);

    // update the config in the workers
    await configure();
}
