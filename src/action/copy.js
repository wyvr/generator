import { statSync } from 'fs';
import { join } from 'path';
import {
    FOLDER_GEN,
    FOLDER_GEN_ASSETS,
    FOLDER_GEN_SRC,
    FOLDER_LIST_PACKAGE_COPY,
    FOLDER_PLUGINS,
    FOLDER_PAGES,
    FOLDER_SRC,
    FOLDER_CRON,
} from '../constants/folder.js';
import { Config } from '../utils/config.js';
import { set_config_cache } from '../utils/config_cache.js';
import { collect_files, copy as copy_file, exists, read, write } from '../utils/file.js';
import { Logger } from '../utils/logger.js';
import { Plugin } from '../utils/plugin.js';
import { to_relative_path_of_gen } from '../utils/to.js';
import { replace_src_path } from '../utils/transform.js';
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
            packages.reverse().forEach((pkg) => {
                copy_folder(pkg.path, FOLDER_LIST_PACKAGE_COPY, Cwd.get(FOLDER_GEN), (file, target) => {
                    const rel_path = to_relative_path_of_gen(target);
                    // get file modify time of page files
                    if (target.match(new RegExp(`/${FOLDER_PAGES}/`)) && !target.match(new RegExp(`/${FOLDER_SRC}/`))) {
                        const stats = statSync(file.src);
                        mtime[rel_path] = {
                            mtime: stats.mtime,
                            src: file.src,
                        };
                    }

                    // e.g. target "./src/file.svelte"
                    // transform to "./src/file.svelte" "src/file.svelte"
                    const target_key = file.target.replace(/^\.\//, '');
                    package_tree[target_key] = pkg;
                    // @TODO sometimes @src does not get replaced
                    // replace @src in plugins and cron jobs
                    if ([`/${FOLDER_PLUGINS}/`, `/${FOLDER_CRON}/`].find((path) => target.indexOf(path) > -1)) {
                        write(target, replace_src_path(read(target), FOLDER_GEN_SRC));
                    }
                });
            });
            set_config_cache('package_tree', package_tree);
            set_config_cache('mtime', mtime);
            Logger.info('copied files');

            // Copy configured asset files
            const assets = Config.get('assets');
            copy_files(assets, Cwd.get(FOLDER_GEN_ASSETS));
            Logger.info('copied configured assets');
        });
    });
    return {
        package_tree,
        mtime,
    };
}

export function copy_files(files, to, before) {
    if (filled_array(files) && filled_string(to)) {
        const beforeFn = is_func(before) ? before : () => {};
        files.forEach((file) => {
            if (file.src && file.target && exists(file.src)) {
                // join paths
                const target = join(to, file.target);
                Logger.debug('copy', file.src, 'to', target);
                copy_file(file.src, target);
                beforeFn(file, target);
            }
        });
        return true;
    }
    return false;
}

export function copy_folder(source, folder, to, before) {
    if (filled_array(folder) && filled_string(source) && filled_string(to)) {
        folder.forEach((part) => {
            const folder_path = join(source, part);
            if (exists(folder_path)) {
                const files = collect_files(folder_path).map((file) => {
                    return { src: file, target: file.replace(source, '.') };
                });
                copy_files(files, to, before);
            }
        });
        return true;
    }
    return false;
}
