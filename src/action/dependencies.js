import { FOLDER_GEN_SRC } from '../constants/folder.js';
import { WorkerAction } from '../struc/worker_action.js';
import { get_name, WorkerEmit } from '../struc/worker_emit.js';
import { set_config_cache } from '../utils/config_cache.js';
import { flip_dependency_tree } from '../utils/dependency.js';
import { Event } from '../utils/event.js';
import { collect_svelte_files } from '../utils/file.js';
import { Plugin } from '../utils/plugin.js';
import { is_array, is_null } from '../utils/validate.js';
import { Cwd } from '../vars/cwd.js';
import { WorkerController } from '../worker/controller.js';
import { measure_action } from './helper.js';

export async function dependencies() {
    const name = 'dependencies';

    const dependency_name = get_name(WorkerEmit.dependencies);
    const dependencies = {};

    const i18n_name = get_name(WorkerEmit.i18n);
    const i18n = {};

    await measure_action(name, async () => {
        const dep_listener_id = Event.on('emit', dependency_name, (data) => {
            const deps = data?.dependencies;
            if (!is_null(deps)) {
                Object.keys(deps).forEach((file) => {
                    if (!is_array(dependencies[file])) {
                        dependencies[file] = [];
                    }
                    const clean_deps = deps[file].filter((dep) => dep != file);
                    dependencies[file].push(...clean_deps);
                });
            }
        });
        const i18n_listener_id = Event.on('emit', i18n_name, (data) => {
            const result = data?.i18n;
            if (!is_null(result)) {
                Object.keys(result).forEach((file) => {
                    if (!is_array(i18n[file])) {
                        i18n[file] = [];
                    }
                    i18n[file].push(...result[file]);
                });
            }
        });

        const data = collect_svelte_files(Cwd.get(FOLDER_GEN_SRC)).map((file) => file.path);
        // wrap in plugin
        const caller = await Plugin.process(name, data);
        await caller(async (data) => {
            await WorkerController.process_in_workers(WorkerAction.dependencies, data, 10);
        });

        Event.off('emit', dependency_name, dep_listener_id);
        Event.off('emit', i18n_name, i18n_listener_id);

        // create bottom-top dependency tree
        const inverted_dependencies = flip_dependency_tree(dependencies);

        // add to config and write gen files
        set_config_cache('dependencies.top', dependencies);

        set_config_cache('dependencies.bottom', inverted_dependencies);

        set_config_cache('dependencies.i18n', i18n);
    });
}
