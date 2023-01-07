import { join } from 'path';
import { copy_folder } from './copy.js';
import { measure_action } from './helper.js';
import { build_wyvr_internal } from './wyvr_internal.js';
import {
    FOLDER_CSS,
    FOLDER_GEN,
    FOLDER_GEN_DATA,
    FOLDER_I18N,
    FOLDER_JS,
    FOLDER_DEVTOOLS,
    FOLDER_PLUGINS,
} from '../constants/folder.js';
import { WorkerAction } from '../struc/worker_action.js';
import { get_name, WorkerEmit } from '../struc/worker_emit.js';
import { Config } from '../utils/config.js';
import { get_config_cache, set_config_cache } from '../utils/config_cache.js';
import { get_parents_of_file_recursive } from '../utils/dependency.js';
import { Event } from '../utils/event.js';
import { to_index } from '../utils/file.js';
import { Logger } from '../utils/logger.js';
import { to_identifiers } from '../utils/to.js';
import { uniq_values } from '../utils/uniq.js';
import { filled_array, filled_object, in_array } from '../utils/validate.js';
import { Cwd } from '../vars/cwd.js';
import { ReleasePath } from '../vars/release_path.js';
import { WatcherPaths } from '../vars/watcher_paths.js';
import { WorkerController } from '../worker/controller.js';
import { sleep } from '../utils/sleep.js';
import { get_cache_breaker } from '../utils/cache_breaker.mjs';
import {
    regenerate_assets,
    regenerate_exec,
    regenerate_i18n,
    regenerate_plugins,
    regenerate_routes,
    regenerate_src,
    regeneration_static_file,
} from '../utils/regenerate.mjs';
import { RegenerateFragment } from '../model/regenerate_fragment.mjs';

/**
 * Regenerate the files and the result of the given changed files
 */
export async function regenerate(changed_files) {
    await measure_action('regenerate', async () => {
        const cache_breaker = get_cache_breaker();

        // find all dependencies
        const dependencies_bottom = get_config_cache('dependencies.bottom');

        changed_files = append_dependencies_as_changed_files(changed_files, dependencies_bottom);

        const frag_files = split_changed_files_by_fragment(changed_files);
        const fragments = Object.keys(frag_files);
        if (!filled_array(fragments)) {
            return;
        }

        WorkerController.set_all_workers('force_media_query_files', true);
        let reload_page = false;
        const reload_files = [];

        Logger.debug('changed_files', changed_files);
        Logger.debug('fragments', fragments);
        const packages = Config.get('packages');
        Logger.debug('packages', packages);
        const gen_folder = Cwd.get(FOLDER_GEN);
        const all_identifiers = get_config_cache('identifiers');

        if (in_array(fragments, FOLDER_DEVTOOLS)) {
            regeneration_static_file(RegenerateFragment(frag_files?.devtools), gen_folder);
            await build_wyvr_internal();
        }

        // cron
        regeneration_static_file(RegenerateFragment(frag_files?.cron), gen_folder);

        // assets
        const reload_assets = regenerate_assets(RegenerateFragment(frag_files?.assets), gen_folder);
        reload_files.push(...reload_assets);

        // i18n
        if (in_array(fragments, FOLDER_I18N)) {
            await regenerate_i18n();

            // reload whole page
            reload_page = true;
        }

        // plugins
        if (in_array(fragments, FOLDER_PLUGINS)) {
            await regenerate_plugins(RegenerateFragment(frag_files?.plugins), gen_folder, cache_breaker);

            // reload whole page
            reload_page = true;
        }

        // exec
        const exec_reload = await regenerate_exec(RegenerateFragment(frag_files?.exec), gen_folder);
        if (exec_reload) {
            reload_page = true;
        }

        // src
        const src_result = await regenerate_src(
            RegenerateFragment(frag_files?.src),
            dependencies_bottom,
            all_identifiers,
            gen_folder
        );
        let identifiers = src_result.identifiers;
        let routes = src_result.routes;

        // routes
        const routes_result = await regenerate_routes(
            RegenerateFragment(frag_files?.routes),
            identifiers,
            routes,
            gen_folder
        );
        if (routes_result.reload_page) {
            reload_page = true;
        }
        // @TODO handle collections
        //const collections = routes_result.collections;
        identifiers = routes_result.identifiers;
        routes = routes_result.routes;

        // always add the watching routes to the new generated routes
        const watcher_paths = WatcherPaths.get();
        if (watcher_paths) {
            const watcher_routes = Object.values(watcher_paths)
                .filter((x) => x)
                .map((path) => Cwd.get(FOLDER_GEN_DATA, to_index(path, 'json')));
            Logger.debug('watcher routes', watcher_routes);
            routes = uniq_values([].concat(routes, watcher_routes));
        }

        Logger.debug('routes', routes);
        if (filled_array(routes)) {
            const identifier_name = get_name(WorkerEmit.identifier);
            const identifier_id = Event.on('emit', identifier_name, (data) => {
                if (!data) {
                    return;
                }
                delete data.type;
                identifiers[data.identifier] = data;
            });
            await WorkerController.process_in_workers(WorkerAction.build, routes, 100, true);
            Event.off('emit', identifier_name, identifier_id);
            reload_page = true;
        }

        Logger.debug('identifiers', identifiers);
        if (filled_object(identifiers)) {
            const data = Object.keys(identifiers)
                .map((key) => all_identifiers[key])
                .filter((x) => x);
            await WorkerController.process_in_workers(WorkerAction.scripts, data, 1, true);
            reload_page = true;
            copy_folder(Cwd.get(FOLDER_GEN), [FOLDER_CSS, FOLDER_JS], ReleasePath.get());
        }

        // update the identifiers cache
        const merged_identifiers = to_identifiers(identifiers, all_identifiers);
        set_config_cache('identifiers', merged_identifiers);

        // copy_folder(Cwd.get(FOLDER_GEN), [FOLDER_ASSETS, FOLDER_CSS, FOLDER_JS, FOLDER_I18N], ReleasePath.get());

        // reload the whole browser page
        if (reload_page) {
            await sleep(200);
            Logger.info('force reloading');
            reload();
            return;
        }
        // reload only assets
        if (reload_files.length > 0) {
            reload(reload_files);
        }
    });

    return;
}

export function split_changed_files_by_fragment(changed_files) {
    const result = {};
    Object.keys(changed_files).forEach((event) => {
        changed_files[event].forEach((file) => {
            if (!file) {
                return;
            }
            const fragment = file.rel_path.split('/').find((x) => x);
            if (!result[fragment]) {
                result[fragment] = {};
            }
            if (!result[fragment][event]) {
                result[fragment][event] = [];
            }
            result[fragment][event].push(file);
        });
    });
    return result;
}

export function reload(files) {
    if (!filled_array(files)) {
        files = '*';
    }
    Event.emit('client', 'reload', files);
}

function append_dependencies_as_changed_files(changed_files, dependencies_bottom) {
    const package_tree = get_config_cache('package_tree');

    const mod_files_rel_path = uniq_values(
        []
            .concat(changed_files.change || [], changed_files.add || [])
            .map((file) => file.rel_path)
            .map((rel_path) => get_parents_of_file_recursive(dependencies_bottom, rel_path))
            .flat(2)
    );
    // add the dependencies as "changed" files to the current batch
    mod_files_rel_path.forEach((rel_path) => {
        if (!changed_files.change) {
            changed_files.change = [];
        }
        const entry = {
            rel_path,
        };
        const pkg = package_tree[rel_path];
        if (!pkg) {
            return;
        }
        entry.pkg = pkg;
        entry.path = join(pkg.path, rel_path);
        changed_files.change.push(entry);
    });
    return changed_files;
}
