import { Config } from './config';
import { Logger } from './logger';
import chokidar from 'chokidar';
import fs from 'fs';
import { join } from 'path';
import { hrtime_to_ms } from '@lib/converter/time';

export class Watch {
    changed_files: any[] = [];
    is_executing: boolean = false;

    constructor(private callback: Function = null) {
        if (!callback || typeof callback != 'function') {
            Logger.warning('can not start watching because no callback is defined');
            return;
        }
        this.init();
    }
    private init() {
        const themes = Config.get('themes');
        if (!themes || !Array.isArray(themes) || themes.length == 0) {
            throw 'no themes to watch';
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
        chokidar
            .watch(
                themes.map((theme) => theme.path),
                {
                    ignoreInitial: true,
                }
            )
            .on('all', (event, path) => {
                if (path.indexOf('/.git/') > -1 || path.indexOf('wyvr.js') > -1 || event == 'addDir' || event == 'unlinkDir') {
                    return;
                }
                // find the theme of the changed file
                let theme_index = -1;
                const theme = themes.find((t) => {
                    const cur_theme_index = path.indexOf(t.path);
                    if (cur_theme_index > -1) {
                        theme_index = cur_theme_index;
                        return true;
                    }
                    return false;
                });
                let rel_path = path;
                if (theme) {
                    rel_path = path.replace(theme.path + '/', '');
                    // check if the changed file gets overwritten in another theme
                    if (event != 'unlink' && theme_index > -1 && theme_index < themes.length - 1) {
                        for (let i = theme_index + 1; i < themes.length; i++) {
                            const theme_path = join(themes[i].path, rel_path);
                            if (fs.existsSync(theme_path) && theme_path != path) {
                                Logger.warning(
                                    'ignore',
                                    `${event}@${Logger.color.dim(path)}`,
                                    'because it gets overwritten by theme',
                                    Logger.color.bold(themes[i].name),
                                    Logger.color.dim(theme_path)
                                );
                                return;
                            }
                        }
                    }
                    Logger.info('detect', `${event} ${theme.name}@${Logger.color.dim(rel_path)}`);
                } else {
                    Logger.warning('detect', `${event}@${Logger.color.dim(path)}`, 'from unknown theme');
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
                const files = this.changed_files.filter((f) => f);
                // reset the files
                this.changed_files = [];
                debounce = setTimeout(async () => {
                    this.is_executing = true;
                    const hr_start = process.hrtime();
                    await this.callback(files);
                    bs.reload();
                    const timeInMs = hrtime_to_ms(process.hrtime(hr_start));
                    Logger.stop('watch total', timeInMs);
                    this.is_executing = false;
                }, 500);
            });
        Logger.info('watching', themes.length, 'themes');
    }
}
