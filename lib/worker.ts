import { WorkerHelper } from '@lib/worker/helper';
import { WorkerStatus } from '@lib/model/worker/status';
import { WorkerAction } from '@lib/model/worker/action';

(async () => {
    let config = null;
    let env = null;
    let cwd = null;
    process.title = `wyvr worker generator ${process.pid}`;

    WorkerHelper.send_status(WorkerStatus.exists);

    process.on('message', (msg) => {
        const action = (msg && msg.action && msg.action.key) || null;
        switch (action) {
            case WorkerAction.configure:
                // set the config of the worker by the main process
                config = msg.action.value.config;
                env = msg.action.value.env;
                cwd = msg.action.value.cwd;
                // only when everything is configured set the worker idle
                if (config && env && cwd) {
                    WorkerHelper.send_status(WorkerStatus.idle);
                }
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
})();
