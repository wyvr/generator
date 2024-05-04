import { extname } from 'node:path';
import { FOLDER_GEN_ROUTES, FOLDER_GEN_PLUGINS, FOLDER_GEN_SRC, FOLDER_GEN_EVENTS } from '../constants/folder.js';
import { WorkerAction } from '../struc/worker_action.js';
import { get_name, WorkerEmit } from '../struc/worker_emit.js';
import { set_config_cache } from '../utils/config_cache.js';
import { cache_dependencies } from '../utils/dependency.js';
import { Event } from '../utils/event.js';
import { collect_files, to_extension } from '../utils/file.js';
import { Plugin } from '../utils/plugin.js';
import { in_array, is_array, is_null } from '../utils/validate.js';
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
                for (const file of Object.keys(deps)) {
                    if (!is_array(dependencies[file])) {
                        dependencies[file] = [];
                    }
                    const clean_deps = deps[file].filter((dep) => dep !== file);
                    dependencies[file].push(...clean_deps);
                }
            }
        });
        const i18n_listener_id = Event.on('emit', i18n_name, (data) => {
            const result = data?.i18n;
            if (!is_null(result)) {
                for (const file of Object.keys(result)) {
                    if (!is_array(i18n[file])) {
                        i18n[file] = [];
                    }
                    i18n[file].push(...result[file]);
                }
            }
        });

        const data = [].concat(
            collect_files(Cwd.get(FOLDER_GEN_SRC)).filter((path, index, list) => {
                // ignore split files
                const extension = extname(path);
                if (!in_array(['.css', '.scss', '.js', '.mjs', '.cjs', '.ts'], extension)) {
                    return true;
                }
                return list.indexOf(to_extension(path, 'svelte')) === -1;
            }),
            collect_files(Cwd.get(FOLDER_GEN_PLUGINS)),
            collect_files(Cwd.get(FOLDER_GEN_ROUTES)),
            collect_files(Cwd.get(FOLDER_GEN_EVENTS))
        );

        // wrap in plugin
        const caller = await Plugin.process(name, data);
        await caller(async (data) => {
            await WorkerController.process_in_workers(WorkerAction.dependencies, data, 10);
        });

        Event.off('emit', dependency_name, dep_listener_id);
        Event.off('emit', i18n_name, i18n_listener_id);

        // cache the given dependencies
        cache_dependencies(dependencies);

        await set_config_cache('dependencies.i18n', i18n);
    });
}
