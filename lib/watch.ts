import { Config } from './config';
import { Logger } from './logger';
import chokidar from 'chokidar';
import fs from 'fs';
import { join } from 'path';
import { hrtime_to_ms } from '@lib/converter/time';
import { RequireCache } from '@lib/require_cache';

export class Watch {
    changed_files: any[] = [];
    is_executing: boolean = false;

    constructor(private callback: Function = null) {
        if (!callback || typeof callback != 'function') {
            Logger.warning('can not start watching because no callback is defined');
            return;
        }
        RequireCache.clear();
        this.init();
    }
    private restart() {
        process.kill(process.pid, 'SIGUSR2');
    }
    private init() {
        const packages = Config.get('packages');
        if (!packages || !Array.isArray(packages) || packages.length == 0) {
            throw 'no packages to watch';
        }

        // start reloader
        const bs = require('browser-sync').create();
        bs.init(
            {
                proxy: Config.get('url'),
                ghostMode: false,
                open: false,
            },
            function () {
                Logger.info('sync is ready');
            }
        );
        // watch for file changes
        let debounce = null;
        const watch_folder = packages.map((pkg) => pkg.path);
        watch_folder.push(join(process.cwd(), 'wyvr.js'));
        chokidar
            .watch(watch_folder, {
                ignoreInitial: true,
            })
            .on('all', (event, path) => {
                if (
                    path.indexOf('package.json') > -1 ||
                    path.indexOf('package-lock.json') > -1 ||
                    path.indexOf('/node_modules') > -1 ||
                    path.indexOf('/.git/') > -1 ||
                    event == 'addDir' ||
                    event == 'unlinkDir'
                ) {
                    return;
                }
                // when config file is changed restart
                if (path.indexOf('wyvr.js') > -1) {
                    Logger.info('config file has changed', path, 'restarting');

                    return this.restart();
                }
                // find the pkg of the changed file
                let pkg_index = -1;
                const pkg = packages.find((t) => {
                    const cur_pkg_index = path.indexOf(t.path.replace(/^\.\//, ''));
                    if (cur_pkg_index > -1) {
                        pkg_index = cur_pkg_index;
                        return true;
                    }
                    return false;
                });
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
                    Logger.info('detect', `${event} ${pkg.name}@${Logger.color.dim(rel_path)}`);
                } else {
                    Logger.warning('detect', `${event}@${Logger.color.dim(path)}`, 'from unknown pkg');
                }
                // check if the file is empty >= ignore it for now
                if (event != 'unlink' && fs.readFileSync(path, { encoding: 'utf-8' }).trim() == '') {
                    Logger.warning('the file is empty, empty files are ignored');
                    return;
                }
                // avoid that 2 commands get sent
                if (this.is_executing == true) {
                    Logger.warning('currently running, try again after current execution');
                    return;
                }
                this.changed_files = [...this.changed_files, { event, path, rel_path }];
                if (debounce) {
                    clearTimeout(debounce);
                }
                debounce = setTimeout(async () => {
                    const files = this.changed_files.filter((f) => f);
                    // reset the files
                    this.changed_files = [];
                    this.is_executing = true;
                    const hr_start = process.hrtime();
                    await this.callback(files);
                    // reload only whole page when no static asset is given
                    const reload_files = files
                        .map((f) => f.rel_path)
                        .filter((p) => {
                            return p.match(/^(assets|css|js|md)\//);
                        });
                    bs.reload(reload_files.length > 0 ? reload_files : undefined);

                    RequireCache.clear();
                    const timeInMs = hrtime_to_ms(process.hrtime(hr_start));
                    Logger.stop('watch total', timeInMs);
                    this.is_executing = false;
                }, 500);
            });
        Logger.info('watching', packages.length, 'packages');
    }
}
