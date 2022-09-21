import { join } from 'path';
import { copy_files, copy_folder } from '../action/copy.js';
import { measure_action } from '../action/helper.js';
import { i18n } from '../action/i18n.js';
import { build_wyvr_internal } from '../action/wyvr_internal.js';
import {
    FOLDER_ASSETS,
    FOLDER_CSS,
    FOLDER_EXEC,
    FOLDER_GEN,
    FOLDER_GEN_DATA,
    FOLDER_GEN_SRC,
    FOLDER_I18N,
    FOLDER_JS,
    FOLDER_ROUTES,
    FOLDER_SRC,
    FOLDER_DEVTOOLS,
} from '../constants/folder.js';
import { Route } from '../model/route.js';
import { WorkerAction } from '../struc/worker_action.js';
import { get_name, WorkerEmit } from '../struc/worker_emit.js';
import { Config } from '../utils/config.js';
import { get_config_cache, set_config_cache } from '../utils/config_cache.js';
import { get_identifiers_of_file } from '../utils/dependency.js';
import { Event } from '../utils/event.js';
import { copy, remove, to_extension, to_index } from '../utils/file.js';
import { Logger } from '../utils/logger.js';
import { to_identifiers, to_relative_path, to_single_identifier_name } from '../utils/to.js';
import { uniq_values } from '../utils/uniq.js';
import { filled_array, filled_object, filled_string, in_array, is_null, match_interface } from '../utils/validate.js';
import { Cwd } from '../vars/cwd.js';
import { ReleasePath } from '../vars/release_path.js';
import { WatcherPaths } from '../vars/watcher_paths.js';
import { WorkerController } from '../worker/controller.js';

/**
 * Regenerate the files and the result of the given changed files
 */
export async function regenerate_command(changed_files) {
    const frag_files = split_changed_files_by_fragment(changed_files);
    const fragments = Object.keys(frag_files);
    if (!filled_array(fragments)) {
        return;
    }

    WorkerController.set_all_workers('force_media_query_files', true);
    let reload_page = false;

    Logger.debug('changed_files', changed_files);
    Logger.debug('fragments', fragments);
    const packages = Config.get('packages');
    Logger.debug('packages', packages);
    const gen_folder = Cwd.get(FOLDER_GEN);
    const all_identifiers = get_config_cache('identifiers');

    await measure_action('regenerate', async () => {
        // regenerate assets
        if (in_array(fragments, FOLDER_ASSETS)) {
            const assets = frag_files.assets;
            // copy modified and added files into the release and gen folder
            const modified_assets = [].concat(assets.change || [], assets.add || []);
            if (modified_assets.length > 0) {
                const copy_assets = modified_assets.map((file) => ({ src: file.path, target: './' + file.rel_path }));
                copy_files(copy_assets, ReleasePath.get());
                copy_files(copy_assets, gen_folder);
            }
            if (assets.unlink) {
                assets.unlink.forEach((file) => {
                    remove(join(ReleasePath.get(), file.rel_path));
                    remove(join(gen_folder, file.rel_path));
                });
            }
            // @TODO reload resource in browser
            reload(modified_assets.map((file) => file?.rel_path).filter((x) => x));
        }

        // regenerate i18n
        if (in_array(fragments, FOLDER_I18N)) {
            await i18n(packages);
            copy_folder(Cwd.get(FOLDER_GEN), [FOLDER_I18N], ReleasePath.get());
            // @TODO reload the whole browser page
            reload_page = true;
        }

        // copy exec
        if (in_array(fragments, FOLDER_EXEC)) {
            const exec = frag_files.exec;
            const modified_exec = [].concat(exec.change || [], exec.add || []);
            if (modified_exec.length > 0) {
                [].concat(exec.change || [], exec.add || []).map((file) => {
                    copy(file.path, Cwd.get(FOLDER_GEN, file.rel_path));
                });
                // @TODO reload the whole browser page
                reload_page = true;
            }
        }
        const identifiers = {};
        let routes = [];

        if (in_array(fragments, FOLDER_SRC)) {
            const shortcode_identifiers = Object.values(all_identifiers).filter((identifier) => {
                return identifier.imports;
            });
            const identifier_files = get_config_cache('identifier.files');
            const dependencies_bottom = get_config_cache('dependencies.bottom');
            const src = frag_files.src;
            if (src.change || src.add) {
                const identifier_list = [];
                const dependent_files = [];
                const main_files = [];
                const files = [].concat(src.change || [], src.add || []).map((file) => {
                    const rel_path = file.rel_path.replace(/^src\//, '');
                    if (rel_path.match(/^(?:doc|layout|page)\//)) {
                        main_files.push(rel_path);
                    }
                    const { identifiers_of_file, files } = get_identifiers_of_file(dependencies_bottom, rel_path);
                    dependent_files.push(...files);
                    if (filled_array(identifiers_of_file)) {
                        identifier_list.push(...identifiers_of_file);
                    }
                    const target = Cwd.get(FOLDER_GEN, file.rel_path);
                    copy(file.path, target);
                    return target;
                    // console.log(file.rel_path, dependencies_bottom);
                });
                const combined_files = uniq_values(
                    [].concat(
                        files,
                        dependent_files.filter((x) => x).map((path) => Cwd.get(FOLDER_GEN_SRC, path))
                    )
                );

                // detect shortcode dependencies
                const used_shortcode_identifiers = shortcode_identifiers.filter((identifier) => {
                    let contains = false;
                    Object.values(identifier.imports).find((entry) => {
                        contains = in_array(combined_files, entry);
                        return contains;
                    });
                    return contains;
                });
                if (filled_array(used_shortcode_identifiers)) {
                    // delete the possible shortcode dependencies otherwise these will no be regenerated
                    used_shortcode_identifiers.forEach((identifier) => {
                        Object.values(identifier.imports).forEach((file) => {
                            const component = Cwd.get(FOLDER_GEN, 'js', to_extension(to_relative_path(file), 'js'));
                            remove(component);
                            const component_map = to_extension(component, 'js.map');
                            remove(component_map);
                        });
                    });
                }

                const config_name = get_name(WorkerEmit.wyvr_config);
                const file_configs = get_config_cache('dependencies.config', {});

                // wrap in plugin
                const config_id = Event.on('emit', config_name, (data) => {
                    if (is_null(data) || !match_interface(data, { file: true, config: true })) {
                        return;
                    }
                    file_configs[data.file] = data.config;
                });

                await WorkerController.process_in_workers(WorkerAction.transform, combined_files, 10);

                // @TODO update dependencies

                await WorkerController.process_in_workers(WorkerAction.compile, combined_files, 10);

                // remove listeners
                Event.off('emit', config_name, config_id);

                set_config_cache('dependencies.config', file_configs);

                // when doc, layout or page has changed search directly in the routes reference
                if (filled_array(main_files)) {
                    const identifier_keys = Object.keys(identifier_files);
                    main_files.forEach((file) => {
                        if (file.match(/^(?:doc|layout|page)\//)) {
                            const identifier_name = to_single_identifier_name(file);
                            const wildcard = '[^-]+';
                            const regexp = new RegExp(
                                '^' +
                                    (file.match(/^doc\//) ? identifier_name : wildcard) +
                                    '-' +
                                    (file.match(/^layout\//) ? identifier_name : wildcard) +
                                    '-' +
                                    (file.match(/^page\//) ? identifier_name : wildcard) +
                                    '$'
                            );

                            identifier_keys.forEach((identifier) => {
                                if (identifier.match(regexp)) {
                                    identifier_list.push({ identifier });
                                }
                            });
                        }
                    });
                }
                // get 2 dimensional array of affected urls
                const identifier_files_list = uniq_values(identifier_list).map((identifier) => {
                    identifiers[identifier.identifier] = identifier;
                    return identifier_files[identifier.identifier];
                });
                // convert the urls to data json paths
                const data_files = []
                    .concat(...identifier_files_list)
                    .map((url) => Cwd.get(FOLDER_GEN_DATA, to_index(url, 'json')));
                // add the json paths to be executed as routes
                routes.push(...data_files);
            }
        }

        if (in_array(fragments, FOLDER_DEVTOOLS)) {
            const devtools = frag_files.devtools;
            if (devtools.unlink) {
                devtools.unlink.forEach((file) => {
                    const gen_target = Cwd.get(FOLDER_GEN, file.rel_path);
                    remove(gen_target);
                    const release_target = join(ReleasePath.get(), file.rel_path);
                    remove(release_target);
                });
            }
            if (devtools.change || devtools.add) {
                [].concat(devtools.change || [], devtools.add || []).map((file) => {
                    const target = Cwd.get(FOLDER_GEN, file.rel_path);
                    copy(file.path, target);
                    return target;
                });
            }
            await build_wyvr_internal();
        }

        // regenerate routes
        const collections = {};
        if (in_array(fragments, FOLDER_ROUTES)) {
            if (frag_files.routes.change || frag_files.routes.add) {
                const mod_routes = [].concat(frag_files.routes.change || [], frag_files.routes.add || []);
                const mod_routes_copy = mod_routes.map((file) => ({ src: file.path, target: './' + file.rel_path }));
                copy_files(mod_routes_copy, gen_folder);
                const routes_data = mod_routes.map((file) => {
                    return new Route({
                        path: join(gen_folder, file.rel_path),
                        rel_path: file.rel_path,
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
            reload_page = true;
        }

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
            await WorkerController.process_in_workers(WorkerAction.build, routes, 100);
            Event.off('emit', identifier_name, identifier_id);
            reload_page = true;
        }
        Logger.debug('identifiers', identifiers);
        if (filled_object(identifiers)) {
            const data = Object.keys(identifiers).map((key) => all_identifiers[key]);
            await WorkerController.process_in_workers(WorkerAction.scripts, data, 1);
            reload_page = true;
        }

        // update the identifiers cache
        const merged_identifiers = to_identifiers(identifiers, all_identifiers);
        set_config_cache('identifiers', merged_identifiers);

        copy_folder(Cwd.get(FOLDER_GEN), [FOLDER_ASSETS, FOLDER_CSS, FOLDER_JS, FOLDER_I18N], ReleasePath.get());

        // @TODO reload the whole browser page
        if (reload_page) {
            Logger.info('force reloading');
            reload();
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
