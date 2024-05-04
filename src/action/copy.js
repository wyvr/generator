import { statSync } from 'node:fs';
import { join } from 'node:path';
import {
    FOLDER_GEN,
    FOLDER_GEN_ASSETS,
    FOLDER_GEN_SRC,
    FOLDER_LIST_PACKAGE_COPY,
    FOLDER_PLUGINS,
    FOLDER_PAGES,
    FOLDER_SRC,
    FOLDER_CRON,
    FOLDER_GEN_SERVER,
    FOLDER_ROUTES,
    FOLDER_EVENTS
} from '../constants/folder.js';
import { Config } from '../utils/config.js';
import { set_config_cache } from '../utils/config_cache.js';
import { collect_files, copy as copy_file, exists, read, write } from '../utils/file.js';
import { Logger } from '../utils/logger.js';
import { Plugin } from '../utils/plugin.js';
import { to_relative_path_of_gen } from '../utils/to.js';
import { replace_src_path, replace_wyvr_magic } from '../utils/transform.js';
import { filled_array, filled_string, is_func } from '../utils/validate.js';
import { Cwd } from '../vars/cwd.js';
import { measure_action } from './helper.js';

export async function copy(available_packages) {
    const name = 'copy';

    const package_tree = {};
    const mtime = {};

    await measure_action(name, async () => {
        // wrap in plugin
        const caller = await Plugin.process(name, available_packages);
        await caller(async (packages) => {
            // Copy static files from packages
            // Copy files from packages and override in the reversed package order
            // Build Tree of files and packages
            const packages_ordered = packages.filter(Boolean).reverse();
            for (const pkg of packages_ordered) {
                copy_folder(pkg.path, FOLDER_LIST_PACKAGE_COPY, Cwd.get(FOLDER_GEN), (file, target) => {
                    const rel_path = to_relative_path_of_gen(target);
                    // get file modify time of page files
                    if (target.match(new RegExp(`/${FOLDER_PAGES}/`)) && !target.match(new RegExp(`/${FOLDER_SRC}/`))) {
                        const stats = statSync(file.src);
                        mtime[rel_path] = {
                            mtime: stats.mtime,
                            src: file.src
                        };
                    }

                    // e.g. target "./src/file.svelte"
                    // transform to "./src/file.svelte" "src/file.svelte"
                    const target_key = file.target.replace(/^\.\//, '');
                    package_tree[target_key] = pkg;
                    // replace @src in plugins and cron jobs(executables)
                    copy_executable_file(target, target);
                });
            }
            await set_config_cache('package_tree', package_tree);
            await set_config_cache('mtime', mtime);
            Logger.info('copied files');

            // Copy configured asset files
            const assets = Config.get('assets');
            copy_files(assets, Cwd.get(FOLDER_GEN_ASSETS));
            Logger.info('copied configured assets');
        });
    });
    return {
        package_tree,
        mtime
    };
}

export function copy_files(files, to, before) {
    if (filled_array(files) && filled_string(to)) {
        const beforeFn = is_func(before) ? before : () => {};
        for (const file of files) {
            if (!file.target) {
                Logger.warning('missing target when copying', file);
                break;
            }
            if (file.src && exists(file.src)) {
                // join paths
                const target = join(to, file.target);
                Logger.debug('copy', file.src, 'to', target);
                copy_file(file.src, target);
                beforeFn(file, target);
            } else {
                Logger.warning('can not copy non existing file', file.src);
            }
        }
        return true;
    }
    return false;
}

export function copy_folder(source, folder, to, before) {
    if (filled_array(folder) && filled_string(source) && filled_string(to)) {
        for (const part of folder) {
            const folder_path = join(source, part);
            if (exists(folder_path)) {
                const files = collect_files(folder_path).map((file) => {
                    return { src: file, target: file.replace(source, '.') };
                });
                copy_files(files, to, before);
            }
        }
        return true;
    }
    return false;
}

export function copy_executable_file(source, target) {
    if (!source) {
        return false;
    }
    const folders = [`/${FOLDER_PLUGINS}/`, `/${FOLDER_CRON}/`, `/${FOLDER_ROUTES}/`, `/${FOLDER_EVENTS}/`];
    const folder = folders.find((path) => source.indexOf(path) > -1);
    if (!folder) {
        return false;
    }
    // replace the wyvr content in the files, by make it server code
    const content = replace_wyvr_magic(read(source), false);

    write(target, replace_src_path(content, FOLDER_GEN_SERVER));
    return true;
}
