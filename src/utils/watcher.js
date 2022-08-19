import { Cwd } from '../vars/cwd.js';
import { Logger } from './logger.js';
import { filled_array } from './validate.js';
import { watch } from 'chokidar';
import { restart } from '../cli/restart.js';
import { uniq_values } from './uniq.js';
import { regenerate_command } from '../command/regenerate.js';
import { get_config_cache } from './config_cache.js';

let watcher;
let working = false;
let debouncer;
let changed_files = {};
let pkgs;

export async function package_watcher(packages) {
    if (!filled_array(packages)) {
        Logger.error('missing packages in package_watcher');
        return;
    }
    pkgs = packages;
    return new Promise(() => {
        const watch_folder = packages.map((pkg) => pkg.path);
        watch_folder.push(Cwd.get('wyvr.js'));

        watcher = watch(watch_folder, {
            ignoreInitial: true,
        }).on('all', watcher_event);

        Logger.success('watching', packages.length, 'packages');
        set_waiting();
    });
}

export function watcher_event(event, path) {
    if (ignore_watched_file(event, path)) {
        return;
    }

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
    }, 250);
}

export async function process_changed_files(changed_files, packages) {
    const events = Object.keys(changed_files);
    const package_tree = get_config_cache('package_tree');

    let restart_required = false;
    const changed_config_files = [];
    events.forEach((event) => {
        changed_files[event] = changed_files[event].map((path) => {
            const pkg = packages.find((pkg) => path.indexOf(pkg.path) == 0);
            let pkg_path = '';
            if (pkg) {
                pkg_path = pkg.path;
            }

            const rel_path = path.replace(pkg_path + '/', '');

            const used_pkg = package_tree[rel_path];
            if (used_pkg && used_pkg.path != pkg_path) {
                Logger.warning(
                    `ignoring ${event} of ${rel_path} from ${pkg.name}, it is used from ${
                        used_pkg.name
                    } ${Logger.color.dim(used_pkg.path)}`
                );
                return;
            }

            Logger.info('detect', event, Logger.color.dim(pkg_path + '/') + rel_path);

            // when config file is changed restart
            if (path.match(/wyvr\.js$/)) {
                restart_required = true;
                changed_config_files.push(path);
            }
            return {
                path,
                rel_path,
                pkg,
            };
        });
    });

    if (restart_required) {
        Logger.warning('restart required because of the following file changes', changed_config_files.join(', '));
        // needed otherwise wyvr instances get kept alive
        await unwatch();
        restart();
        return;
    }

    await regenerate_command(changed_files);
}

export function ignore_watched_file(event, path) {
    return (
        !path ||
        path.indexOf('package.json') > -1 ||
        path.indexOf('package-lock.json') > -1 ||
        path.indexOf('/node_modules') > -1 ||
        path.indexOf('/.git/') > -1 ||
        event == 'addDir' ||
        event == 'unlinkDir'
    );
}

export async function unwatch() {
    pkgs = undefined;
    return new Promise((resolve, reject) => {
        if (watcher) {
            const save_guard = setTimeout(() => {
                /* c8 ignore next */
                reject(false);
            }, 1000);
            watcher.close().then(() => {
                clearTimeout(save_guard);
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
