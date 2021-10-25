import { IPerformance_Measure } from '@lib/performance_measure';
import { Dir } from '@lib/dir';
import { Logger } from '@lib/logger';
import { Env } from '@lib/env';
import { Port } from '@lib/port';
import { Config } from '@lib/config';
import { packages } from '../main/packages';
import { EnvModel } from '../model/env';
import { Global } from '../global';
import { WorkerController } from '../worker/controller';
import { File } from '../file';
import { hrtime_to_ms } from '../converter/time';
import { shutdown, fail } from '../helper/endings';
import { Watch } from '../watch';
import { Plugin } from '../plugin';

export class BuildMode {
    hr_start = null;
    watcher_ports: [number, number] = [3000, 3001];
    constructor(private perf: IPerformance_Measure) {
        this.hr_start = process.hrtime();
        if (!this.perf) {
            Logger.error('missing performance measure method');
            process.exit(1);
            return;
        }
    }
    async init() {
        this.perf.start('config');
        // a new build must destroy the old generated data
        Dir.clear('gen');

        if (Env.is_dev()) {
            // get the first 2 free ports for the watcher
            this.watcher_ports[0] = await Port.find(this.watcher_ports[0]); // server
            this.watcher_ports[1] = await Port.find(this.watcher_ports[1]); // socket
            Logger.present('server port', this.watcher_ports[0]);
            Logger.present('socket port', this.watcher_ports[1]);
        }
        // add to Global
        const config = Config.get(null);
        config.env = EnvModel[Env.get()];
        config.https = !!config.https;
        await Global.set('global', config);

        this.perf.end('config');
    }
    async start(worker_controller: WorkerController) {
        // collect configured package
        Logger.block('build');
        this.perf.start('packages');
        const pkgs = await packages();
        this.perf.end('packages');
        Logger.debug('project_config', JSON.stringify(Config.get(), null, 4));

        // execute
        await this.execute();

        // save config for cron and debugging
        File.write_json('gen/config.json', Config.get());

        // save cron file
        const cron = Config.get('cron');
        if (cron) {
            File.write_json(
                'gen/cron.json',
                cron.map((entry) => {
                    entry.last_execution = new Date().getTime();
                    return entry;
                })
            );
        }

        const timeInMs = hrtime_to_ms(process.hrtime(this.hr_start));
        Logger.stop('initial total', timeInMs);

        if (Env.is_prod()) {
            return shutdown();
        }
        // watch for file changes
        try {
            const watch = new Watch(this.watcher_ports, async (changed_files: any[], watched_files: string[]) => {
                Plugin.clear();
                return await this.execute(changed_files, watched_files);
            });
        } catch (e) {
            fail(e);
        }
    }
}
