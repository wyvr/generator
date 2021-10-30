import { IPerformance_Measure } from '@lib/performance_measure';
import { Logger } from '@lib/logger';
import { Config } from '@lib/config';
import { File } from '@lib/file';
import { routes } from '@lib/main/routes';
import { fail } from '@lib/helper/endings';
import { WorkerController } from '@lib/worker/controller';
import { hrtime_to_ms } from '@lib/converter/time';
import { build_files } from '@lib/main/build';
import { optimize } from '@lib/main/optimize';
import { CronStatePath } from '@lib/vars/cron_state_path';
import { PackageTreePath } from '@lib/vars/package_tree_path';
import { ConfigPath } from '@lib/vars/config_path';

export class CronMode {
    hr_start = null;
    cron_state = [];
    cron_config = [];
    package_tree = {};

    constructor(private perf: IPerformance_Measure) {
        this.hr_start = process.hrtime();
        if (!this.perf) {
            Logger.error('missing performance measure method');
            process.exit(1);
            return;
        }
    }

    async init() {
        Logger.block('cron');
        this.perf.start('cron');

        // get the configs
        Config.set(File.read_json(ConfigPath.get()));
        this.cron_state = File.read_json(CronStatePath.get());
        console.log(this.cron_state);
        this.package_tree = File.read_json(PackageTreePath.get());

        if (this.cron_state) {
            // use only cron entries which should be executed
            this.cron_state = this.cron_state.filter((state) => {
                return state.last_execution + state.every * 60 * 1000 < new Date().getTime();
            });
        } else {
            this.cron_state = [];
        }
        Logger.info('rebuild', this.cron_state.length, 'routes');
        this.perf.end('cron');

        if (this.cron_state.length == 0) {
            Logger.improve('nothing to build');
            process.exit(0);
            return;
        }
    }
    async start(worker_controller: WorkerController) {
        /* eslint-disable @typescript-eslint/no-unused-vars */
        // execute the routes
        this.perf.start('routes');
        const [route_files, cron_routes] = await routes(worker_controller, this.package_tree, null, true, this.cron_state);
        this.perf.end('routes');

        // avoid empty build
        if (!cron_routes || cron_routes.length == 0) {
            fail('no routes to rebuild');
            return;
        }
        // build the cron routes
        this.perf.start('build');
        // build static files
        const [build_pages, identifier_data_list] = await build_files(worker_controller, cron_routes);
        this.perf.end('build');

        await optimize(this.perf, identifier_data_list, worker_controller);

        // update last execution time in cron file
        const state_ids = this.cron_state.map((state) => state.id);
        Config.get('cron').map((entry) => {
            const index = state_ids.indexOf(entry.id);
            if (index > -1) {
                entry.last_execution = new Date().getTime();
            }
        });
        const timeInMs = hrtime_to_ms(process.hrtime(this.hr_start));
        Logger.stop('cron total', timeInMs);
        /* eslint-enable */
    }
}
