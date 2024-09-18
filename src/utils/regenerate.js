import { extname, join } from 'node:path';
import { copy_executable_file, copy_files, copy_folder } from '../action/copy.js';
import { i18n } from '../action/i18n.js';
import { FOLDER_GEN, FOLDER_GEN_CLIENT, FOLDER_GEN_EVENTS, FOLDER_GEN_SERVER, FOLDER_I18N } from '../constants/folder.js';
import { Page } from '../model/page.js';
import { Cwd } from '../vars/cwd.js';
import { ReleasePath } from '../vars/release_path.js';
import { Config } from './config.js';
import { build_cache, clear_caches } from './routes.js';
import { copy, exists, read, remove, to_extension, write } from './file.js';
import { clear_cache } from './i18n.js';
import { Plugin } from './plugin.js';
import { replace_imports, replace_wyvr_magic } from './transform.js';
import { WorkerAction } from '../struc/worker_action.js';
import { WorkerController } from '../worker/controller.js';
import { filled_array, in_array, is_null } from './validate.js';
import { get_config_cache } from './config_cache.js';
import { uniq_values } from './uniq.js';
import { to_relative_path, to_single_identifier_name } from './to.js';
import { transform } from '../action/transform.js';
import { process_pages } from '../action/page.js';
import { update_project_events } from './project_events.js';
import { add_dev_note } from './devtools.js';
import { get_identifiers_of_list, get_parents_of_file, parse_content } from './dependency.js';
import { Dependency } from '../model/dependency.js';
import { CodeContext } from '../struc/code_context.js';

let dep_db;

function regenerate_server_files({ change, add, unlink }, gen_folder, scope) {
    const modified = [].concat(change, add);
    let done = false;
    if (modified.length > 0) {
        if (!dep_db) {
            dep_db = new Dependency();
        }
        for (const file of modified) {
            const content = read(file.path);
            if (is_null(content)) {
                continue;
            }

            const parsed = parse_content(content, file.rel_path);
            if (parsed) {
                dep_db.update_file(parsed.rel_path, parsed.dependencies, parsed?.config);
            }
            const replaced_content = add_dev_note(file.rel_path, replace_imports(replace_wyvr_magic(content, CodeContext.server), file.path, FOLDER_GEN_SERVER, scope));

            write(join(gen_folder, file.rel_path), replaced_content);
            done = true;
        }
    }
    if (unlink?.length > 0) {
        done = true;
    }
    unlink_from(unlink, gen_folder);
    return done;
}

/**
 * Regenerate the plugins
 * @param {RegenerateFragment} RegenerateFragment
 * @param {string} gen_folder
 * @param {string} cache_breaker
 */
export async function regenerate_plugins({ change, add, unlink }, gen_folder) {
    const done = regenerate_server_files({ change, add, unlink }, gen_folder, 'plugins');
    await Plugin.initialize();
    return done;
}

/**
 * Regenerate the events
 * @param {RegenerateFragment} RegenerateFragment
 * @param {string} gen_folder
 */
export async function regenerate_events({ change, add, unlink }, gen_folder) {
    const done = regenerate_server_files({ change, add, unlink }, gen_folder, 'events');
    await update_project_events(FOLDER_GEN_EVENTS);
    return done;
}

/**
 * Regenerate the commands
 * @param {RegenerateFragment} RegenerateFragment
 * @param {string} gen_folder
 */
export async function regenerate_commands({ change, add, unlink }, gen_folder) {
    return regenerate_server_files({ change, add, unlink }, gen_folder, 'commands');
}

/**
 * Regenerate the routes
 * @param {RegenerateFragment} RegenerateFragment
 * @param {string} gen_folder
 * @returns whether the page has to be reloaded or not
 */
export async function regenerate_routes({ change, add, unlink }, gen_folder) {
    if (!dep_db) {
        dep_db = new Dependency();
    }
    let reload_page = false;
    const modified_route = [].concat(change, add);
    if (modified_route.length > 0) {
        modified_route.map((file) => {
            copy_executable_file(file.path, join(gen_folder, file.rel_path));
            const content = read(file.path);

            const parsed = parse_content(content, file.rel_path);
            if (parsed) {
                dep_db.update_file(parsed.rel_path, parsed.dependencies, parsed?.config);
            }
        });
        reload_page = true;
    }
    unlink_from(unlink, gen_folder);
    clear_caches();
    await build_cache();
    return reload_page;
}

export async function regenerate_src({ change, add, unlink }, all_identifiers) {
    const shortcode_identifiers = Object.values(all_identifiers).filter((identifier) => {
        return identifier.imports;
    });
    const identifiers = {};
    const pages = [];
    const test_files = [];
    if (!dep_db) {
        dep_db = new Dependency();
    }
    const inverted_index = dep_db.get_inverted_index();

    const mod_files = [].concat(change, add);
    if (mod_files.length > 0) {
        const identifier_files = get_config_cache('identifiers.files', {});
        const main_files = [];
        const dependent_files = [];
        // get dependencies of the file and copy them to the gen folder
        const files = [];
        for (const file of mod_files) {
            const rel_path = file.rel_path.replace(/^\/?(src\/)/, '$1');
            const content = read(file.path);
            if (is_null(content)) {
                continue;
            }
            const parsed = parse_content(content, file.rel_path);
            let file_dep;
            if (parsed) {
                file_dep = dep_db.update_file(parsed.rel_path, parsed.dependencies, parsed?.config);
            }

            if (in_array(['doc', 'layout', 'page'], file_dep?.root)) {
                main_files.push(rel_path);
            }

            // @WARNING when file is created the first time the inverted_index doesn't know anything about the parents or when the children gets modified to much, they are not updated in this run
            dependent_files.push(...get_parents_of_file(rel_path, inverted_index));

            const target = Cwd.get(FOLDER_GEN, file.rel_path);
            copy(file.path, target);
            files.push(target);
        }
        if (!filled_array(files)) {
            return { identifiers, pages, test_files };
        }
        const identifiers_list = get_identifiers_of_list(dependent_files);

        // combine the changed files with the dependent files, to get newly added parents of a file
        const combined_files = uniq_values(
            [].concat(
                files,
                dependent_files.map((entry) => Cwd.get(FOLDER_GEN, entry.file))
            )
        );
        for (const file of combined_files) {
            const ext = extname(file);
            if (ext === '.svelte') {
                continue;
            }
            // search for test files, they must be evaluated later
            if (ext === '.mjs' || ext === '.cjs' || ext === '.js') {
                const test_file = to_extension(file, `.spec${ext}`);
                if (exists(test_file)) {
                    test_files.push(test_file);
                    combined_files.push(test_file);
                }
            }
            // include the root of a split file, will be deprecated in the future
            // @deprecated
            const svelte_file = to_extension(file, '.svelte');
            if (exists(svelte_file)) {
                combined_files.push(svelte_file);
            }
        }

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
            for (const identifier of used_shortcode_identifiers) {
                for (const file of Object.values(identifier.imports)) {
                    const component = Cwd.get(FOLDER_GEN, 'js', to_extension(to_relative_path(file), 'js'));
                    remove(component);
                    const component_map = to_extension(component, 'js.map');
                    remove(component_map);
                }
            }
        }

        // transform and prefill with the existing configs
        await transform(combined_files, true);

        await WorkerController.process_in_workers(WorkerAction.compile, combined_files, 10, true);

        // when doc, layout or page has changed search directly in the pages reference
        if (filled_array(main_files)) {
            const identifier_keys = Object.keys(all_identifiers).concat(Object.keys(identifier_files));
            for (const file of main_files) {
                const no_src_file = file.replace(/^\/?src\//, '');
                if (no_src_file.match(/^(?:doc|layout|page)\//)) {
                    const identifier_name = to_single_identifier_name(no_src_file);
                    const wildcard = '[^-]+';
                    const doc_name = no_src_file.match(/^doc\//) ? identifier_name : wildcard;
                    const layout_name = no_src_file.match(/^layout\//) ? identifier_name : wildcard;
                    const page_name = no_src_file.match(/^page\//) ? identifier_name : wildcard;
                    const regexp = new RegExp(`^${doc_name}-${layout_name}-${page_name}$`);

                    for (const identifier of identifier_keys) {
                        if (identifier.match(regexp)) {
                            identifiers_list.push(
                                all_identifiers[identifier] ?? {
                                    identifier
                                }
                            );
                        }
                    }
                }
            }
        }
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

        const cleaned_identifier_list = uniq_values(identifiers_list);
        if (filled_array(cleaned_identifier_list)) {
            // convert to object
            for (const identifier of identifiers_list) {
                identifiers[identifier.identifier] = identifier;
            }
        }
    }

    unlink_from(unlink, Cwd.get(FOLDER_GEN), Cwd.get(FOLDER_GEN_CLIENT), Cwd.get(FOLDER_GEN_SERVER));
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
    if (!dep_db) {
        dep_db = new Dependency();
    }
    let reload_page = false;
    let collections = {};
    let page_objects = [];
    const mod_pages = [].concat(change, add).filter(Boolean);
    if (mod_pages.length > 0) {
        const mod_pages_copy = mod_pages.map((file) => ({
            src: file.path,
            target: `./${file.rel_path}`
        }));
        copy_files(mod_pages_copy, gen_folder);
        const pages_data = mod_pages.map((file) => {
            const content = read(file.path);

            const parsed = parse_content(content, file.rel_path);
            if (parsed) {
                dep_db.update_file(parsed.rel_path, parsed.dependencies, parsed?.config);
            }
            return new Page({
                path: join(gen_folder, file.rel_path),
                rel_path: file.rel_path,
                pkg: file.pkg
            });
        });
        const result = await process_pages('page', pages_data, true);
        if (result) {
            collections = result.collections;
            page_objects = result.page_objects;
            pages.push(...result.pages);
            for (const [name, value] of Object.entries(result.identifiers)) {
                identifiers[name] = value;
            }
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
        page_objects
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
        const copy_assets = modified_assets.map((file) => ({
            src: file.path,
            target: `./${file.rel_path}`
        }));
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
        for (const file of unlink) {
            for (const folder of folders) {
                remove(join(folder, file.rel_path));
            }
        }
    }
}

/**
 * Copy the given files to the gen folder
 * @param {RegenerateFragment} RegenerateFragment
 * @param {string} gen_folder
 */
export function regeneration_static_file({ change, add, unlink }, gen_folder) {
    if (!dep_db) {
        dep_db = new Dependency();
    }
    const files = [].concat(change, add);
    for (const file of files) {
        const target = join(gen_folder, file.rel_path);
        if (!copy_executable_file(file.path, target)) {
            copy(file.path, target);
        }

        const content = read(file.path);

        const parsed = parse_content(content, file.rel_path);
        if (parsed) {
            dep_db.update_file(parsed.rel_path, parsed.dependencies, parsed?.config);
        }
    }
    unlink_from(unlink, gen_folder, ReleasePath.get());
}
