import { WorkerHelper } from '@lib/worker/helper';
import { WorkerStatus } from '@lib/model/worker/status';
import { WorkerAction } from '@lib/model/worker/action';
import { Generate } from '@lib/generate';

export class Worker {
    private config = null;
    private env = null;
    private cwd = null;
    constructor() {
        this.init();
    }
    async init() {
        process.title = `wyvr worker ${process.pid}`;

        WorkerHelper.send_status(WorkerStatus.exists);

        process.on('message', (msg) => {
            const action = msg?.action?.key;
            const value = msg?.action?.value;
            if (!value) {
                console.log('ignored message from main, no value given', msg);
                return;
            }
            switch (action) {
                case WorkerAction.configure:
                    // set the config of the worker by the main process
                    this.config = value.config;
                    this.env = value.env;
                    this.cwd = value.cwd;
                    // only when everything is configured set the worker idle
                    if (this.config && this.env && this.cwd) {
                        WorkerHelper.send_status(WorkerStatus.idle);
                    }
                    break;
                case WorkerAction.build:
                    WorkerHelper.send_status(WorkerStatus.busy);
                    console.log(value, Generate.get(value));
                    setTimeout(() => {
                        WorkerHelper.send_status(WorkerStatus.idle);
                    }, 100);
                    break;
                case WorkerAction.status:
                default:
                    console.log('ignored message from main', msg);
                    break;
            }
        });

        process.on('uncaughtException', (err) => {
            console.error('worker PID', process.pid, 'uncaughtException', err.message, err.stack);
            process.exit(1);
        });
    }
}
