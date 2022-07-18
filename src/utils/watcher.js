import { join, sep } from 'path';
import { Cwd } from '../vars/cwd.js';
import { Logger } from './logger.js';
import { filled_array } from './validate.js';
import { watch } from 'chokidar';
import { exists, remove } from './file.js';
import { FOLDER_GEN } from '../constants/folder.js';
import { restart } from '../cli/restart.js';
import { uniq_values } from './uniq.js';

export async function package_watcher(packages) {
    return new Promise((resolve, reject) => {
        if (!filled_array(packages)) {
            Logger.error('missing packages in package_watcher');
            return reject();
        }
        let debouncer;
        const watch_folder = packages.map((pkg) => pkg.path);
        watch_folder.push(join(Cwd.get(), 'wyvr.js'));
        let changed_files = {};

        watch(watch_folder, {
            ignoreInitial: true,
        }).on('all', (event, path) => {
            if (ignore_watched_file(event, path)) {
                return;
            }
            if (!changed_files[event]) {
                changed_files[event] = [];
            }
            changed_files[event] = uniq_values([path, ...changed_files[event]]);
            clearTimeout(debouncer);
            debouncer = setTimeout(() => {
                process_changed_files(changed_files);
                changed_files = {};
            }, 1000);
        });
        Logger.success('watching', packages.length, 'packages');
    });

    // // find the package of the changed file
    // let pkg_index = -1;
    // let pkg = null;
    // for (let index = packages.length - 1; index >= 0; index--) {
    //     const cur_pkg_index = path.indexOf(packages[index].path.replace(/^\.\//, ''));
    //     if (cur_pkg_index > -1) {
    //         pkg_index = index;
    //         pkg = packages[index];
    //         break;
    //     }
    // }
    // let rel_path = path;
    // if (pkg) {
    //     rel_path = path.replace(pkg.path + '/', '');
    //     // check if the changed file gets overwritten in another pkg
    //     if (event != 'unlink' && pkg_index > -1 && pkg_index < packages.length - 1) {
    //         for (let i = pkg_index + 1; i < packages.length; i++) {
    //             const pkg_path = join(packages[i].path, rel_path);
    //             if (fs.existsSync(pkg_path) && pkg_path != path) {
    //                 Logger.warning(
    //                     'ignore',
    //                     `${event}@${Logger.color.dim(path)}`,
    //                     'because it gets overwritten by pkg',
    //                     Logger.color.bold(packages[i].name),
    //                     Logger.color.dim(pkg_path)
    //                 );
    //                 return;
    //             }
    //         }
    //     }
    //     Logger.info('detect', `${event} ${pkg.name} ${Logger.color.dim(rel_path)}`);
    // } else {
    //     Logger.warning('detect', `${event}@${Logger.color.dim(path)}`, 'from unknown pkg');
    // }
    // // check if the file is empty >= ignore it for now
    // const content = File.read(path);
    // if (event != 'unlink' && (!content || content.trim() == '')) {
    //     Logger.warning('the file is empty, empty files are ignored');
    //     return;
    // }
    // // when file gets deleted, delete it from the gen folder
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
}

export async function process_changed_files(changed_files) {
    const events = Object.keys(changed_files);

    let restart_required = false;
    const changed_config_files = [];
    events.forEach((event) => {
        changed_files[event].forEach((path) => {
            // when config file is changed restart
            if (path.match(/wyvr\.js$/)) {
                restart_required = true;
                changed_config_files.push(path);
            }
        });
    });

    if (restart_required) {
        Logger.warning('restart required because of the following file changes', changed_config_files.join(', '));

        //restart();
    }
}

export function ignore_watched_file(event, path) {
    return (
        path.indexOf('package.json') > -1 ||
        path.indexOf('package-lock.json') > -1 ||
        path.indexOf('/node_modules') > -1 ||
        path.indexOf('/.git/') > -1 ||
        event == 'addDir' ||
        event == 'unlinkDir'
    );
}
