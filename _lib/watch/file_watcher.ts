import { join, sep } from 'path';
import { Cwd } from '@lib/vars/cwd';
import { File } from '@lib/file';
import { Logger } from '@lib/logger';
import chokidar from 'chokidar';
import fs from 'fs';
import { IWatchFile } from '@lib/interface/watch';

function stop(path: string, event: string) {
    return (
        path.indexOf('package.json') > -1 ||
        path.indexOf('package-lock.json') > -1 ||
        path.indexOf('/node_modules') > -1 ||
        path.indexOf('/.git/') > -1 ||
        event == 'addDir' ||
        event == 'unlinkDir'
    );
}

export default (packages, on_complete: (changed_files: IWatchFile[]) => void) => {
    let debounce = null;
    const watch_folder = packages.map((pkg) => pkg.path);
    watch_folder.push(join(Cwd.get(), 'wyvr.js'));
    let changed_files: IWatchFile[] = [];
    chokidar
        .watch(watch_folder, {
            ignoreInitial: true,
        })
        .on('all', (event, path) => {
            if (stop(path, event)) {
                return;
            }
            Logger.info(event, path);
            // when config file is changed restart
            if (path.indexOf('wyvr.js') > -1) {
                Logger.warning('config file has changed', path, ', restart required');

                Logger.warning('type "rs" and press [enter] to restart nodemon');
                process.exit(1);
            }
            // find the package of the changed file
            let pkg_index = -1;
            let pkg = null;
            for (let index = packages.length - 1; index >= 0; index--) {
                const cur_pkg_index = path.indexOf(packages[index].path.replace(/^\.\//, ''));
                if (cur_pkg_index > -1) {
                    pkg_index = index;
                    pkg = packages[index];
                    break;
                }
            }
            let rel_path = path;
            if (pkg) {
                rel_path = path.replace(pkg.path + '/', '');
                // check if the changed file gets overwritten in another pkg
                if (event != 'unlink' && pkg_index > -1 && pkg_index < packages.length - 1) {
                    for (let i = pkg_index + 1; i < packages.length; i++) {
                        const pkg_path = join(packages[i].path, rel_path);
                        if (fs.existsSync(pkg_path) && pkg_path != path) {
                            Logger.warning(
                                'ignore',
                                `${event}@${Logger.color.dim(path)}`,
                                'because it gets overwritten by pkg',
                                Logger.color.bold(packages[i].name),
                                Logger.color.dim(pkg_path)
                            );
                            return;
                        }
                    }
                }
                Logger.info('detect', `${event} ${pkg.name} ${Logger.color.dim(rel_path)}`);
            } else {
                Logger.warning('detect', `${event}@${Logger.color.dim(path)}`, 'from unknown pkg');
            }
            // check if the file is empty >= ignore it for now
            const content = File.read(path);
            if (event != 'unlink' && (!content || content.trim() == '')) {
                Logger.warning('the file is empty, empty files are ignored');
                return;
            }
            // when file gets deleted, delete it from the gen folder
            if (event == 'unlink') {
                // remove first part => "[src]/layout..."
                const parts = rel_path.split(sep).filter((x, i) => i != 0);
                const gen = join(Cwd.get(), 'gen');
                const short_path = parts.join(sep);
                // existing files in the gen folder
                const existing_paths = fs
                    .readdirSync(gen)
                    .map((dir) => join(gen, dir, short_path))
                    .filter((path) => fs.existsSync(path));
                // delete the files
                existing_paths.forEach((path) => fs.unlinkSync(path));
            }

            changed_files = [...changed_files, { event, path, rel_path }];
            if (debounce) {
                clearTimeout(debounce);
            }
            debounce = setTimeout(() => {
                if (typeof on_complete != 'function') {
                    Logger.error('on_complete is not set');
                    return;
                }
                Logger.block('rebuild');
                on_complete(changed_files);
                changed_files = [];
            }, 500);
        });
};
