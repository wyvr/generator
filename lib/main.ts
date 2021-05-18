import * as fs from 'fs-extra';

import { v4 } from 'uuid';

import { Build } from '@lib/build';
import { Bundle } from '@lib/bundle';
import { Link } from '@lib/link';
const importer = require('@lib/importer');
import { Dir } from '@lib/dir';
const logger = require('@lib/logger');
const worker_controller = require('@lib/worker/controller');
const config = require('@lib/config');
import { Env } from '@lib/env';
import { EnvModel } from './model/env';

export class Main {
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
        logger.logo();
        logger.present('PID', pid, logger.color.dim(`"${process.title}"`));
        logger.present('cwd', cwd);
        logger.present('build', uniq_id);
        logger.present('env', EnvModel[Env.get()]);

        const project_config = config.get();
        logger.debug('project_config', project_config);

        const worker_amount = worker_controller.get_worker_amount();
        logger.present('workers', worker_amount, logger.color.dim(`of ${require('os').cpus().length} cores`));
        const workers = worker_controller.create_workers(worker_amount);

        Dir.create('pub');

        // Import the data source
        try {
            const datasets = await importer.import('./data/sample.json');
        } catch (e) {
            logger.error(e);
            return;
        }

        // Process files in workers

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
        // link.to_pub('assets');

        var hr_end = process.hrtime(hr_start); // hr_end[0] is in seconds, hr_end[1] is in nanoseconds
        const timeInMs = (hr_end[0] * 1000000000 + hr_end[1]) / 1000000; // convert first to ns then to ms
        logger.success('total execution time', timeInMs, 'ms');

        if (Env.is_prod()) {
            setTimeout(() => {
                logger.success('shutdown');
                process.exit(0);
            }, 500);
        }
    }
}
(async () => {})();
