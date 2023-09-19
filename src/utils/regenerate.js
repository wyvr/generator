import { extname, join } from 'path';
import { copy_executable_file, copy_files, copy_folder } from '../action/copy.js';
import { i18n } from '../action/i18n.js';
import { FOLDER_GEN, FOLDER_GEN_CLIENT, FOLDER_GEN_SERVER, FOLDER_GEN_SRC, FOLDER_I18N } from '../constants/folder.js';
import { Page } from '../model/page.js';
import { Cwd } from '../vars/cwd.js';
import { ReleasePath } from '../vars/release_path.js';
import { Config } from './config.js';
import { build_cache, clear_caches } from './routes.js';
import { copy, exists, read, remove, to_extension, write } from './file.js';
import { clear_cache } from './i18n.js';
import { Plugin } from './plugin.js';
import { replace_imports } from './transform.js';
import { WorkerAction } from '../struc/worker_action.js';
import { WorkerController } from '../worker/controller.js';
import { filled_array, filled_object, in_array } from './validate.js';
import { cache_dependencies, dependencies_from_content, get_identifiers_of_file } from './dependency.js';
import { get_config_cache } from './config_cache.js';
import { uniq_values } from './uniq.js';
import { to_relative_path, to_single_identifier_name } from './to.js';
import { transform } from '../action/transform.js';
import { process_pages } from '../action/page.js';

/**
 * Regenerate the plugins
 * @param {RegenerateFragment} RegenerateFragment
 * @param {string} gen_folder
 * @param {string} cache_breaker
 */
export async function regenerate_plugins({ change, add, unlink }, gen_folder) {
    const modified_plugins = [].concat(change, add);
    if (modified_plugins.length > 0) {
        modified_plugins.forEach((file) => {
            write(
                join(gen_folder, file.rel_path),
                replace_imports(read(file.path), file.path, FOLDER_GEN_SRC, 'plugins')
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
        const identifier_files = get_config_cache('identifiers.files', {});
        const identifier_list = [];
        const dependent_files = [];
        const main_files = [];
        // get dependencies of the file and copy them to the gen folder
        const files = mod_files.map((file) => {
            const rel_path = file.rel_path.replace(/^\/?(src\/)/, '$1');
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
            if (rel_path.match(/^src\/(?:doc|layout|page)\//)) {
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
            // cache the given dependencies
            cache_dependencies(new_dep);
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
                const ext = extname(file);
                if (ext == '.svelte') {
                    return file;
                }
                const svelte_file = to_extension(file, '.svelte');
                if (exists(svelte_file)) {
                    return [file, svelte_file];
                }
                if (ext == '.mjs' || ext == '.cjs' || ext == '.js') {
                    const test_file = to_extension(file, '.spec' + ext);
                    if (exists(test_file)) {
                        return [file, test_file];
                    }
                    return file;
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

        // transform and prefill with the existing configs
        const file_configs = get_config_cache('dependencies.config', {});
        await transform(combined_files, file_configs, true);

        await WorkerController.process_in_workers(WorkerAction.compile, combined_files, 10, true);

        // when doc, layout or page has changed search directly in the pages reference
        if (filled_array(main_files)) {
            const identifier_keys = Object.keys(all_identifiers).concat(Object.keys(identifier_files));
            main_files.forEach((file) => {
                const no_src_file = file.replace(/^\/?src\//, '');
                if (no_src_file.match(/^(?:doc|layout|page)\//)) {
                    const identifier_name = to_single_identifier_name(no_src_file);
                    const wildcard = '[^-]+';
                    const regexp = new RegExp(
                        '^' +
                            (no_src_file.match(/^doc\//) ? identifier_name : wildcard) +
                            '-' +
                            (no_src_file.match(/^layout\//) ? identifier_name : wildcard) +
                            '-' +
                            (no_src_file.match(/^page\//) ? identifier_name : wildcard) +
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
            return identifiers[identifier.identifier];
        });
        // @TODO this makes no sense, identifiers look like this
        /*
        {
            identifier: 'default-default-shop_account',
            doc: 'Default.js',
            layout: 'Default.js',
            page: 'shop/Account.svelte'
        }
        */
        /*
        // convert the urls to data json paths
        const data_files = [].concat(...identifier_files_list).map((url)=>{
            console.log(url)
            return url;
        }).map((url) => get_data_page_path(url));
        // add the json paths to be executed as pages
        pages.push(...data_files);
        */

        // check if files have test files in place and execute them
        test_files = combined_files.filter((file) => file.match(/\.spec\.[mc]js?/));

        // rebuild the identifiers
        if (filled_object(identifiers)) {
            const scripts_data = Object.keys(identifiers).map((key) => identifiers[key]);
            await WorkerController.process_in_workers(WorkerAction.scripts, scripts_data, 1, true);
        }
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
    let collections = {};
    let page_objects = [];
    const mod_pages = [].concat(change, add).filter(Boolean);
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
        const result = await process_pages('page', pages_data, undefined, true);
        if (result) {
            collections = result.collections;
            page_objects = result.page_objects;
            pages.push(...result.pages);
            Object.entries(result.identifiers).forEach(([name, value]) => (identifiers[name] = value));
        }
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
        page_objects,
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
        const target = join(gen_folder, file.rel_path);
        if (!copy_executable_file(file.path, target)) {
            copy(file.path, target);
        }
    });
    unlink_from(unlink, gen_folder, ReleasePath.get());
}
