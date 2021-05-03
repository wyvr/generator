const worker_status = require('_lib/model/worker/status');
const worker_action = require('_lib/model/worker/action');
const helper = require('_lib/worker/helper');

(async () => {
    let config = null;
    let env = null;
    let cwd = null;
    process.title = `wyvr worker generator ${process.pid}`;

    helper.send_status(worker_status.exists);

    process.on('message', (msg) => {
        const action = (msg && msg.action && msg.action.key) || null;
        switch (action) {
            case worker_action.configure:
                console.log('configure', msg.action.value);
                // set the config of the worker by the main process
                config = msg.action.value.config;
                env = msg.action.value.env;
                cwd = msg.action.value.cwd;
                // only when everything is configured set the worker idle
                if (config && env && cwd) {
                    helper.send_status(worker_status.idle);
                }
                break;
            case worker_action.status:
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
