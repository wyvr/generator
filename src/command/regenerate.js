import { join } from 'path';
import { copy_files, copy_folder } from '../action/copy.js';
import { measure_action } from '../action/helper.js';
import { i18n } from '../action/i18n.js';
import { FOLDER_ASSETS, FOLDER_GEN, FOLDER_I18N, FOLDER_ROUTES } from '../constants/folder.js';
import { Route } from '../model/route.js';
import { WorkerAction } from '../struc/worker_action.js';
import { get_name, WorkerEmit } from '../struc/worker_emit.js';
import { Config } from '../utils/config.js';
import { get_config_cache, set_config_cache } from '../utils/config_cache.js';
import { Event } from '../utils/event.js';
import { remove } from '../utils/file.js';
import { Logger } from '../utils/logger.js';
import { to_identifiers } from '../utils/to.js';
import { filled_array, filled_string, in_array } from '../utils/validate.js';
import { Cwd } from '../vars/cwd.js';
import { ReleasePath } from '../vars/release_path.js';
import { WorkerController } from '../worker/controller.js';

/**
 * Regenerate the files and the result of the given changed files
 */
export async function regenerate_command(changed_files) {
    const frag_files = split_changed_files_by_fragment(changed_files);
    const fragments = Object.keys(frag_files);
    Logger.info('changed_files', changed_files);
    Logger.info('fragments', fragments);
    const packages = Config.get('packages');
    Logger.info('packages', packages);
    const gen_folder = Cwd.get(FOLDER_GEN);

    await measure_action('regenerate', async () => {
        // regenerate assets
        if (in_array(fragments, FOLDER_ASSETS)) {
            const assets = frag_files.assets;
            // copy modified and added files into the release and gen folder
            if (assets.change || assets.add) {
                const mod_assets = []
                    .concat(assets.change || [], assets.add || [])
                    .map((file) => ({ src: file.path, target: '.' + file.rel_path }));
                copy_files(mod_assets, ReleasePath.get());
                copy_files(mod_assets, gen_folder);
            }
            if (assets.unlink) {
                assets.unlink.forEach((file) => {
                    remove(join(ReleasePath.get(), file.rel_path));
                    remove(join(gen_folder, file.rel_path));
                });
            }
            // @TODO reload resource in browser
        }

        // regenerate i18n
        if (in_array(fragments, FOLDER_I18N)) {
            await i18n(packages);
            copy_folder(Cwd.get(FOLDER_GEN), [FOLDER_I18N], ReleasePath.get());
            // @TODO reload the whole browser page
        }

        // regenerate routes
        let routes = [];
        const identifiers = {};
        const collections = {};
        if (in_array(fragments, FOLDER_ROUTES)) {
            if (frag_files.routes.change || frag_files.routes.add) {
                const mod_routes = [].concat(frag_files.routes.change || [], frag_files.routes.add || []);
                const mod_routes_copy = mod_routes.map((file) => ({ src: file.path, target: '.' + file.rel_path }));
                copy_files(mod_routes_copy, gen_folder);
                const routes_data = mod_routes.map((file) => {
                    return new Route({
                        path: join(gen_folder, file.rel_path),
                        rel_path: file.rel_path.replace(/^\//, ''),
                        pkg: file.pkg,
                    });
                });
                const identifier_name = get_name(WorkerEmit.identifier);
                const collection_name = get_name(WorkerEmit.collection);
                const routes_name = get_name(WorkerEmit.route);
                const identifier_id = Event.on('emit', identifier_name, (data) => {
                    if (!data) {
                        return;
                    }
                    delete data.type;
                    identifiers[data.identifier] = data;
                });
                const collection_id = Event.on('emit', collection_name, (data) => {
                    if (!data || !data.collection) {
                        return;
                    }
                    data.collection.forEach((entry) => {
                        if (!filled_string(entry.url)) {
                            return;
                        }
                        if (!collections[entry.scope]) {
                            collections[entry.scope] = [];
                        }
                        collections[entry.scope].push(entry);
                    });
                });
                const routes_id = Event.on('emit', routes_name, (data) => {
                    if (data && data.routes) {
                        routes.push(...data.routes);
                    }
                });
                await WorkerController.process_in_workers(WorkerAction.route, routes_data, 10);

                // remove listeners
                Event.off('emit', identifier_name, identifier_id);
                Event.off('emit', collection_name, collection_id);
                Event.off('emit', routes_name, routes_id);
            }
            // @TODO reload the whole browser page
        }

        if(filled_array(routes)) {
            const identifier_name = get_name(WorkerEmit.identifier);
            const identifier_id = Event.on('emit', identifier_name, (data) => {
                if (!data) {
                    return;
                }
                delete data.type;
                identifiers[data.identifier] = data;
            });
            await WorkerController.process_in_workers(WorkerAction.build, routes, 100);
            Event.off('emit', identifier_name, identifier_id);
        }

        const merged_identifiers = to_identifiers(get_config_cache('identifiers'), identifiers);
        set_config_cache('identifiers', merged_identifiers);
        Logger.info('identifiers', merged_identifiers);

        // Object.keys(changed_files).forEach((event) => {
        //     changed_files[event].forEach((file) => {
        //         switch (event) {
        //             case 'unlink':
        //                 remove_deleted_files(file.rel_path);
        //                 break;
        //         }
        //     });
        // });
    });

    return;
}

export function split_changed_files_by_fragment(changed_files) {
    const result = {};
    Object.keys(changed_files).forEach((event) => {
        changed_files[event].forEach((file) => {
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

// function find_package_of_file(file) {
//     let pkg_index = -1;
//     let pkg = null;
//     for (let index = packages.length - 1; index >= 0; index--) {
//         const cur_pkg_index = path.indexOf(packages[index].path.replace(/^\.\//, ''));
//         if (cur_pkg_index > -1) {
//             pkg_index = index;
//             pkg = packages[index];
//             break;
//         }
//     }
//     let rel_path = path;
//     if (pkg) {
//         rel_path = path.replace(pkg.path + '/', '');
//         // check if the changed file gets overwritten in another pkg
//         if (event != 'unlink' && pkg_index > -1 && pkg_index < packages.length - 1) {
//             for (let i = pkg_index + 1; i < packages.length; i++) {
//                 const pkg_path = join(packages[i].path, rel_path);
//                 if (fs.existsSync(pkg_path) && pkg_path != path) {
//                     Logger.warning(
//                         'ignore',
//                         `${event}@${Logger.color.dim(path)}`,
//                         'because it gets overwritten by pkg',
//                         Logger.color.bold(packages[i].name),
//                         Logger.color.dim(pkg_path)
//                     );
//                     return;
//                 }
//             }
//         }
//         Logger.info('detect', `${event} ${pkg.name} ${Logger.color.dim(rel_path)}`);
//     } else {
//         Logger.warning('detect', `${event}@${Logger.color.dim(path)}`, 'from unknown pkg');
//     }
// }

// when file gets deleted, delete it from the gen folder
// if (event == 'unlink') {
//     // remove first part => "[src]/layout..."
//     const parts = rel_path.split(sep).filter((x, i) => i != 0);
//     const gen = join(Cwd.get(), FOLDER_GEN);
//     const short_path = parts.join(sep);
//     // existing files in the gen folder
//     const existing_paths = fs
//         .readdirSync(gen)
//         .map((dir) => join(gen, dir, short_path))
//         .filter((path) => exists(path));
//     // delete the files
//     existing_paths.forEach((path) => remove(path));
// }

// changed_files = [...changed_files, { event, path, rel_path }];
// if (debounce) {
//     clearTimeout(debounce);
// }
// debounce = setTimeout(() => {
//     if (typeof on_complete != 'function') {
//         Logger.error('on_complete is not set');
//         return;
//     }
//     Logger.block('rebuild');
//     // on_complete(changed_files);
//     changed_files = [];
// }, 500);
