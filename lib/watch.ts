import { Config } from "./config";
import { Logger } from "./logger";
import chokidar from 'chokidar';
import fs from 'fs';
import { hrtime_to_ms } from '@lib/converter/time';


export class Watch {
    changed_files: any[] = [];
    is_executing: boolean = false;

    constructor(private callback: Function = null) {
        if(!callback || typeof callback != 'function') {
            Logger.warning('can not start watching because no callback is defined')
            return;
        }
        this.init();
    }
    private init() {
        const themes = Config.get('themes');
        if (!themes || !Array.isArray(themes) || themes.length == 0) {
            throw 'no themes to watch'
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
                const theme = themes.find((t) => path.indexOf(t.path) > -1);
                let rel_path = path;
                if (theme) {
                    rel_path = path.replace(theme.path + '/', '');
                    Logger.info('detect', `${event} ${theme.name}@${Logger.color.dim(rel_path)}`);
                } else {
                    Logger.warning('detect', `${event}@${Logger.color.dim(path)}`, 'from unknown theme');
                }
                // check if the file is empty >= ignore it for now
                if (event != 'unlink' && fs.readFileSync(path, { encoding: 'utf-8' }).trim() == '') {
                    Logger.warning('the file is empty, empty files are ignored');
                    return;
                }
                this.changed_files.push({ event, path, rel_path });
                // avoid that 2 commands get sent
                // if (this.is_executing == true) {
                //     Logger.warning('currently running, try again after current execution');
                //     return;
                // }
                if (debounce) {
                    clearTimeout(debounce);
                }
                debounce = setTimeout(async () => {
                    const hr_start = process.hrtime();
                    const files = this.changed_files.filter((f) => f);
                    // reset the files
                    this.changed_files.length = 0;
                    await this.callback(files);
                    bs.reload();
                    const timeInMs = hrtime_to_ms(process.hrtime(hr_start));
                    Logger.success('watch execution time', timeInMs, 'ms');
                }, 500);
            });
        Logger.info('watching', themes.length, 'themes');
    }
}