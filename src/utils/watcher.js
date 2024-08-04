import { Cwd } from '../vars/cwd.js';
import { Logger } from './logger.js';
import { filled_array, in_array, is_func } from './validate.js';
import { watch } from 'chokidar';
import { uniq_values } from './uniq.js';
import { regenerate } from '../action/regenerate.js';
import { extname, join } from 'node:path';
import { exists, to_extension } from './file.js';
import { get_config_path } from './config.js';
import { STORAGE_PACKAGE_TREE } from '../constants/storage.js';
import { KeyValue } from './database/key_value.js';

let watcher;
let working = false;
let debouncer;
let changed_files = {};
let pkgs;
let restart_required = false;

const package_tree_db = new KeyValue(STORAGE_PACKAGE_TREE);

export async function package_watcher(packages, restart_required_callback) {
    if (!filled_array(packages)) {
        Logger.error('missing packages in package_watcher');
        return;
    }
    pkgs = packages;
    return new Promise(() => {
        const watch_folder = packages.map((pkg) => pkg.path);
        const config_path = get_config_path(Cwd.get());
        if (config_path) {
            watch_folder.push(config_path);
        }

        watcher = watch(watch_folder, {
            ignoreInitial: true,
        }).on('all', (event, path) =>
            watcher_event(event, path, restart_required_callback)
        );

        Logger.success('watching', packages.length, 'packages');
        set_waiting();
    });
}

export function watcher_event(event, path, restart_required_callback) {
    if (ignore_watched_file(event, path)) {
        return;
    }
    /* c8 ignore start */
    if (!changed_files[event]) {
        changed_files[event] = [];
    }
    changed_files[event] = uniq_values([path, ...changed_files[event]]);

    if (is_working()) {
        return;
    }

    clearTimeout(debouncer);
    debouncer = setTimeout(async () => {
        working = true;
        await process_changed_files(changed_files, pkgs);
        changed_files = {};
        set_waiting();
        if (restart_required) {
            if (is_func(restart_required_callback)) {
                restart_required_callback();
                restart_required = false;
            } else {
                Logger.warning(
                    'wyvr restart required because of config changes'
                );
            }
        }
    }, 250);
    /* c8 ignore stop */
}

/* c8 ignore start */
export async function process_changed_files(changed_files, packages) {
    const events = Object.keys(changed_files);
    const package_tree = package_tree_db.all();

    const changed_config_files = [];
    const result = [];
    let changed_tree = false;
    for (const event of events) {
        for (const path of changed_files[event]) {
            const pkg = packages.find((pkg) => path.indexOf(pkg.path) === 0);
            let pkg_path = '';
            if (pkg) {
                pkg_path = pkg.path;
            }

            const rel_path = path.replace(`${pkg_path}/`, '');

            const used_pkg = package_tree[rel_path];
            if (used_pkg && used_pkg.path !== pkg_path) {
                // if the given package is over the used, proceed
                const used_index = packages.findIndex((p) => p === used_pkg);
                const current_index = packages.findIndex((p) => p === pkg);
                if (current_index > -1 && current_index >= used_index) {
                    Logger.warning(
                        `ignoring ${event} of ${rel_path} from ${
                            pkg.name
                        }, it is used from ${used_pkg.name} ${Logger.color.dim(
                            used_pkg.path
                        )}`
                    );
                    return;
                }
            }

            Logger.info(
                'detect',
                event,
                Logger.color.dim(`${pkg_path}/`) + rel_path
            );

            // when config file is changed restart
            if (path.match(/wyvr\.[mc]?js$/)) {
                restart_required = true;
                changed_config_files.push(path);
            }
            if (!result[event]) {
                result[event] = [];
            }

            // special behaviour when css or js from svelte file gets changed or edited, only the svelte file should be edited
            if (event === 'add' || event === 'change') {
                const extension = extname(path);
                if (
                    in_array(
                        ['.css', '.scss', '.js', '.mjs', '.cjs', '.ts'],
                        extension
                    )
                ) {
                    const svelte_rel_path = to_extension(rel_path, '.svelte');
                    const pkg = package_tree[svelte_rel_path];
                    if (pkg) {
                        const path = join(pkg.path, svelte_rel_path);
                        if (!result.change) {
                            result.change = [];
                        }
                        result.change.push({
                            path,
                            rel_path: svelte_rel_path,
                            pkg,
                        });
                    }
                }
            }
            // update the entry in the package tree
            if (event === 'add') {
                changed_tree = true;
                package_tree[rel_path] = pkg;
            }
            result[event].push({
                path,
                rel_path,
                pkg,
            });

            // when a file is remove add the next file to the list of changed files
            if (event === 'unlink') {
                // force deletion of the file from the tree
                changed_tree = true;
                package_tree[rel_path] = undefined;

                const remaining_packages = packages.filter((p) => p !== pkg);
                if (remaining_packages) {
                    const fallback_package = remaining_packages.find((p) =>
                        exists(join(p.path, rel_path))
                    );
                    if (fallback_package) {
                        if (!result.change) {
                            result.change = [];
                        }
                        // update the tree with the next relevant file
                        package_tree[rel_path] = fallback_package;
                        result.change.push({
                            path: join(fallback_package.path, rel_path),
                            rel_path,
                            pkg: fallback_package,
                        });
                    }
                }
            }
        }
    }
    if (changed_tree) {
        package_tree_db.setObject(package_tree);
    }

    await regenerate(result);
}
/* c8 ignore stop */
export function ignore_watched_file(event, path) {
    return (
        !path ||
        path.indexOf('package.json') > -1 ||
        path.indexOf('package-lock.json') > -1 ||
        path.indexOf('/node_modules') > -1 ||
        path.indexOf('/.git/') > -1 ||
        event === 'addDir' ||
        event === 'unlinkDir'
    );
}

export async function unwatch() {
    pkgs = undefined;
    return new Promise((resolve, reject) => {
        if (watcher) {
            let save_guard = setTimeout(() => {
                /* c8 ignore next */
                reject(false);
            }, 1000);
            watcher.close().then(() => {
                clearTimeout(save_guard);
                save_guard = null;
                resolve(true);
            });
            return;
        }
        /* c8 ignore next */
        resolve(true);
    });
}

export function set_waiting() {
    Logger.output(undefined, undefined, Logger.color.dim('...'));
    Logger.block('waiting for changes');
    working = false;
}

export function is_working() {
    return !!working;
}
