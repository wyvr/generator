import * as fs from 'fs-extra';

import { v4 } from 'uuid';

import { Build } from '@lib/build';
import { Bundle } from '@lib/bundle';
import { Generate } from '@lib/generate';

import { Link } from '@lib/link';
import { Importer } from '@lib/importer';
import { Dir } from '@lib/dir';
import { Logger } from '@lib/logger';
import { WorkerController } from '@lib/worker/controller';
import { Config } from '@lib/config';
import { Env } from '@lib/env';
import { EnvModel } from '@lib/model/env';
import { Queue } from '@lib/queue';
import { WorkerAction } from '@lib/model/worker/action';
import { WorkerStatus } from './model/worker/status';
import { IPerformance_Measure, Performance_Measure, Performance_Measure_Blank } from '@lib/performance_measure';
import { WorkerModel } from '@lib/model/worker/worker';

export class Main {
    queue: Queue = null;
    worker_controller = new WorkerController();
    perf: IPerformance_Measure;
    worker_amount: number;
    constructor() {
        Env.set(process.env.WYVR_ENV);
        this.init();
    }
    async init() {
        const hr_start = process.hrtime();
        const uniq_id = v4().split('-')[0];
        const pid = process.pid;
        const cwd = process.cwd();
        process.title = `wyvr main ${pid}`;
        Logger.logo();
        Logger.present('PID', pid, Logger.color.dim(`"${process.title}"`));
        Logger.present('cwd', cwd);
        Logger.present('build', uniq_id);
        Logger.present('env', EnvModel[Env.get()]);

        const project_config = Config.get();
        Logger.debug('project_config', project_config);

        this.perf = Config.get('import.measure_performance') ? new Performance_Measure() : new Performance_Measure_Blank();

        this.worker_amount = this.worker_controller.get_worker_amount();
        Logger.present('workers', this.worker_amount, Logger.color.dim(`of ${require('os').cpus().length} cores`));
        const workers = this.worker_controller.create_workers(this.worker_amount);

        Dir.create('pub');

        // import the data source
        let datasets_total = null;
        const importer = new Importer();
        try {
            datasets_total = await importer.import('./data/sample.json', this.generate);
        } catch (e) {
            Logger.error(e);
            return;
        }
        if (!datasets_total) {
            Logger.error('no datasets found');
            return;
        }

        // Process files in workers
        this.perf.start('build');
        await this.build(importer.get_import_list());
        this.perf.end('build');

        //const component = build.compile(filename);
        //console.log('component', component)

        // const rendered = build.render(component, { name: 'P@', details: true });
        // console.log('rendered');
        // console.log(rendered.result.html)

        // await bundle.build(filename)

        // const demo_file = `
        // <!doctype html>
        // <html>
        //     <head>
        //         <link href="/assets/global.css?${uniq_id}" rel="stylesheet" />
        //     </head>
        //     <body>
        //         ${rendered.result.html}
        //         <script src="/bundle.js?${uniq_id}"></script>
        //     </body>
        // </html>`;

        // fs.writeFileSync('./pub/index.html', demo_file);

        // symlink the "static" folders to pub
        Link.to_pub('assets');

        var hr_end = process.hrtime(hr_start); // hr_end[0] is in seconds, hr_end[1] is in nanoseconds
        const timeInMs = (hr_end[0] * 1000000000 + hr_end[1]) / 1000000; // convert first to ns then to ms
        Logger.success('total execution time', timeInMs, 'ms');

        if (Env.is_prod()) {
            setTimeout(() => {
                Logger.success('shutdown');
                process.exit(0);
            }, 500);
        }
    }
    async build(list: string[]) {
        Logger.info('build', list.length, 'datasets');
        // create new queue
        this.queue = new Queue();

        // add the items from the list to the queue in batches for better load balancing
        const amount = list.length;
        const batch_size = 10;
        
        let runs = Math.ceil(amount / batch_size);
        Logger.info('build', runs, 'runs');

        for (let i = 0; i < runs; i++) {
            const queue_data = {
                action: WorkerAction.build,
                data: list.slice(i * batch_size, (i + 1) * batch_size),
            };
            this.queue.push(queue_data);
        }
        return new Promise((resolve, reject) => {
            const listener_id = this.worker_controller.on(WorkerStatus.idle, () => {
                if (this.tick(this.queue)) {
                    this.worker_controller.off(listener_id);
                    resolve(true);
                }
            });
        });
    }
    ticks: number = 0;
    tick(queue: Queue): boolean {
        const workers = this.worker_controller.get_idle_workers();
        this.ticks++;
        if (workers.length == this.worker_amount && queue.length == 0) {
            return true;
        }
        if (queue.length > 0) {
            // get all idle workers
            if (workers.length > 0) {
                workers.forEach((worker) => {
                    const queue_entry = queue.take();
                    if (queue_entry != null) {
                        // set worker busy otherwise the same worker gets multiple actions send
                        worker.status = WorkerStatus.busy;
                        // send the data to the worker
                        this.worker_controller.send_action(worker.pid, queue_entry.action, queue_entry.data);
                    }
                });
            }
        }
        return false;
    }

    generate(data: { key: number; value: any }) {
        data.value = Generate.enhance_data(data.value);
        return data;
    }
}
