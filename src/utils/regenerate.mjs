import { extname, join } from 'path';
import { copy_files, copy_folder } from '../action/copy.js';
import { clear_caches } from '../action/route.js';
import { i18n } from '../action/i18n.js';
import {
    FOLDER_GEN,
    FOLDER_GEN_CLIENT,
    FOLDER_GEN_DATA,
    FOLDER_GEN_SERVER,
    FOLDER_GEN_SRC,
    FOLDER_I18N,
} from '../constants/folder.js';
import { Page } from '../model/page.js';
import { Cwd } from '../vars/cwd.js';
import { ReleasePath } from '../vars/release_path.js';
import { Config } from './config.js';
import { build_cache } from './routes.js';
import { copy, exists, read, remove, to_extension, to_index, write } from './file.js';
import { clear_cache } from './i18n.js';
import { Plugin } from './plugin.js';
import { replace_imports } from './transform.js';
import { get_name, WorkerEmit } from '../struc/worker_emit.js';
import { WorkerAction } from '../struc/worker_action.js';
import { WorkerController } from '../worker/controller.js';
import { filled_array, filled_string, in_array, is_null, match_interface } from './validate.js';
import { Event } from './event.js';
import { dependencies_from_content, flip_dependency_tree, get_identifiers_of_file } from './dependency.js';
import { get_config_cache, set_config_cache } from './config_cache.js';
import { uniq_values } from './uniq.js';
import { to_relative_path, to_single_identifier_name } from './to.js';
import { get_test_file } from './tests.mjs';

/**
 * Regenerate the plugins
 * @param {RegenerateFragment} RegenerateFragment
 * @param {string} gen_folder
 * @param {string} cache_breaker
 */
export async function regenerate_plugins({ change, add, unlink }, gen_folder, cache_breaker) {
    const modified_plugins = [].concat(change, add);
    if (modified_plugins.length > 0) {
        modified_plugins.forEach((file) => {
            write(
                join(gen_folder, file.rel_path),
                replace_imports(read(file.path), file.path, FOLDER_GEN_SRC, 'plugins', cache_breaker)
            );
        });
    }
    unlink_from(unlink, gen_folder);

    await Plugin.initialize();
}
/**
 * Regenerate the plugins
 * @param {RegenerateFragment} RegenerateFragment
 * @param {string} gen_folder
 * @returns whether the page has to be reloaded or not
 */
export async function regenerate_routes({ change, add, unlink }, gen_folder) {
    let reload_page = false;
    const modified_route = [].concat(change, add);
    if (modified_route.length > 0) {
        modified_route.map((file) => {
            copy(file.path, join(gen_folder, file.rel_path));
        });
        reload_page = true;
    }
    unlink_from(unlink, gen_folder);
    clear_caches();
    await build_cache();
    return reload_page;
}

export async function regenerate_src({ change, add, unlink }, dependencies_bottom, all_identifiers, gen_folder) {
    const shortcode_identifiers = Object.values(all_identifiers).filter((identifier) => {
        return identifier.imports;
    });
    let dependencies;
    let identifiers = {};
    let pages = [];
    let test_files = [];

    const mod_files = [].concat(change, add);
    if (mod_files.length > 0) {
        const identifier_files = get_config_cache('identifier.files');
        const identifier_list = [];
        const dependent_files = [];
        const main_files = [];
        // get dependencies of the file and copy them to the gen folder
        const files = mod_files.map((file) => {
            const rel_path = file.rel_path.replace(/^(src\/)/, '$1');
            const dep_result = dependencies_from_content(read(file.path), rel_path);
            if (dep_result?.dependencies) {
                if (!dependencies) {
                    dependencies = {};
                }
                Object.keys(dep_result.dependencies).forEach((key) => {
                    if (!dependencies[key]) {
                        dependencies[key] = [];
                    }
                    dependencies[key].push(...dep_result.dependencies[key]);
                });
            }
            if (rel_path.match(/^(?:doc|layout|page)\//)) {
                main_files.push(rel_path);
            }
            const { identifiers_of_file, files } = get_identifiers_of_file(dependencies_bottom, rel_path);
            dependent_files.push(...files);
            if (filled_array(identifiers_of_file)) {
                identifier_list.push(...identifiers_of_file);
            }
            const target = join(gen_folder, file.rel_path);
            copy(file.path, target);
            return target;
        });

        // update dependencies
        if (dependencies) {
            const new_dep = get_config_cache('dependencies.top');
            Object.keys(dependencies).forEach((key) => {
                if (!new_dep[key]) {
                    new_dep[key] = [];
                }
                new_dep[key].push(...dependencies[key]);
            });
            set_config_cache('dependencies.top', new_dep);
            set_config_cache('dependencies.bottom', flip_dependency_tree(new_dep));
        }

        // when a split file gets edited, also add the original file
        const combined_files = uniq_values(
            [].concat(
                files,
                dependent_files
                    .flat(1)
                    .filter((x) => x)
                    .map((path) => {
                        return Cwd.get(FOLDER_GEN, path);
                    })
            )
        )
            .map((file) => {
                if (extname(file) == '.svelte') {
                    return file;
                }
                const svelte_file = to_extension(file, '.svelte');
                if (exists(svelte_file)) {
                    return [file, svelte_file];
                }
                return file;
            })
            .flat(1);

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

        await WorkerController.process_in_workers(WorkerAction.transform, combined_files, 10, true);

        await WorkerController.process_in_workers(WorkerAction.compile, combined_files, 10, true);

        // remove listeners
        Event.off('emit', config_name, config_id);

        set_config_cache('dependencies.config', file_configs);

        // when doc, layout or page has changed search directly in the pages reference
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
        // add the json paths to be executed as pages
        pages.push(...data_files);

        // check if files have test files in place and execute them
        test_files = combined_files.map((file) => get_test_file(file)).filter((x) => x);
    }
    unlink_from(unlink, gen_folder, Cwd.get(FOLDER_GEN_CLIENT), Cwd.get(FOLDER_GEN_SERVER));
    return { identifiers, pages, test_files };
}

/**
 * Regenerate the pages
 * @param {RegenerateFragment} RegenerateFragment
 * @param {*} identifiers
 * @param {*} pages
 * @param {string} gen_folder
 * @returns an object with reload, identifiers, collections and pages
 */
export async function regenerate_pages({ change, add, unlink }, identifiers, pages, gen_folder) {
    let reload_page = false;
    const collections = {};
    const mod_pages = [].concat(change, add);
    if (mod_pages.length > 0) {
        const mod_pages_copy = mod_pages.map((file) => ({ src: file.path, target: './' + file.rel_path }));
        copy_files(mod_pages_copy, gen_folder);
        const pages_data = mod_pages.map((file) => {
            return new Page({
                path: join(gen_folder, file.rel_path),
                rel_path: file.rel_path,
                pkg: file.pkg,
            });
        });
        const identifier_name = get_name(WorkerEmit.identifier);
        const collection_name = get_name(WorkerEmit.collection);
        const pages_name = get_name(WorkerEmit.page);
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
        const pages_id = Event.on('emit', pages_name, (data) => {
            if (data && data.pages) {
                pages.push(...data.pages);
            }
        });

        await WorkerController.process_in_workers(WorkerAction.page, pages_data, 10, true);

        // remove listeners
        Event.off('emit', identifier_name, identifier_id);
        Event.off('emit', collection_name, collection_id);
        Event.off('emit', pages_name, pages_id);
        reload_page = true;
    }
    if (unlink) {
        // delete the generated pages
        unlink_from(unlink, gen_folder);
    }
    return {
        reload_page,
        identifiers,
        collections,
        pages,
    };
}

/**
 * Regenerate the assets
 * @param {RegenerateFragment} RegenerateFragment
 * @param {string} gen_folder
 * @returns the modified assets for reloading
 */
export function regenerate_assets({ change, add, unlink }, gen_folder) {
    // copy modified and added files into the release and gen folder
    const modified_assets = [].concat(change, add);
    if (modified_assets.length > 0) {
        const copy_assets = modified_assets.map((file) => ({ src: file.path, target: './' + file.rel_path }));
        copy_files(copy_assets, ReleasePath.get());
        copy_files(copy_assets, gen_folder);
    }
    // delete the files
    if (unlink) {
        unlink_from(unlink, gen_folder, ReleasePath.get());
    }

    return modified_assets.map((file) => file?.rel_path).filter((x) => x);
}

/**
 * Regenerate the translations
 */
export async function regenerate_i18n() {
    clear_cache();
    const packages = Config.get('packages');
    await i18n(packages, true);
    copy_folder(Cwd.get(FOLDER_GEN), [FOLDER_I18N], ReleasePath.get());
}

/**
 * Delete the files in the given folders
 * @param {[{rel_path: string}]?} unlink
 * @param  {...string} folders
 */
function unlink_from(unlink, ...folders) {
    if (unlink) {
        unlink.forEach((file) => {
            folders.forEach((folder) => {
                remove(join(folder, file.rel_path));
            });
        });
    }
}

/**
 * Copy the given files to the gen folder
 * @param {RegenerateFragment} RegenerateFragment
 * @param {string} gen_folder
 */
export function regeneration_static_file({ change, add, unlink }, gen_folder) {
    [].concat(change, add).forEach((file) => {
        copy(file.path, join(gen_folder, file.rel_path));
    });
    unlink_from(unlink, gen_folder, ReleasePath.get());
}