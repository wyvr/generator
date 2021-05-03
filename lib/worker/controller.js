const config = require('_lib/config');
const worker_status = require('_lib/model/worker/status');
const worker_action = require('_lib/model/worker/action');
const worker_ratio = config.get('worker.ratio');
const cluster = require('cluster');
const path = require('path');
const logger = require('_lib/logger');
const cwd = process.cwd();

module.exports = {
    workers: [],
    get_worker_amount() {
        // get amount of cores
        // at least one and left 1 core for the main worker
        const cpu_cores = require('os').cpus().length;
        const cpu_cores_ratio = Math.round(cpu_cores * worker_ratio);
        const max_cores = Math.max(1, cpu_cores_ratio - 1);

        return max_cores;
    },
    create() {
        const worker = {
            status: worker_status.undefined,
            pid: 0, // process id
            instance: cluster.fork(),
        };
        worker.pid = worker.instance.pid;
        // creating workers and pushing reference in an array
        // these references can be used to receive messages from workers

        // to receive messages from worker process
        worker.instance.on('message', (msg) => {
            logger.debug('process', worker.pid, 'message', msg);
            this.get_message(msg);
        });
        worker.instance.on('error', (msg) => {
            logger.error('process', worker.pid, 'error', msg);
        });
        worker.instance.on('disconnect', () => {
            logger.debug('process', worker.pid, 'disconnect');
        });
        worker.instance.on('close', (code) => {
            logger.debug('process', worker.pid, 'close', code);
        });
        worker.instance.on('exit', (code) => {
            logger.debug('process', worker.pid, 'exit', code);
        });
        return worker;
    },
    create_workers(amount) {
        this.workers = [];
        for (let i = amount; i > 0; i--) {
            this.workers.push(this.create());
        }
        return this.workers;
    },
    get_message(msg) {
        if (typeof msg == 'string' || !msg.pid || !msg.data || !msg.data.action || !msg.data.action.key || !msg.data.action.value) {
            return;
        }
        const action = msg.data.action.key;
        const data = msg.data.action.value;
        switch(action) {
            case worker_action.status:
                logger.present(`status`, worker_status[data], logger.color.dim(`PID ${msg.pid}`));
                return;
        }
    },

    test() {
        for (let i = 0; i < configuredWorkers; i++) {
            this.createWorker();
        }
        // process is clustered on a core and process id is assigned
        cluster.on('online', (worker) => {
            this.output.log('worker PID', worker.process.pid, 'started');
            const workerObject = this.getWorker(worker.process.pid);
            if (!workerObject) {
                this.output.err('can not find worker', worker.process.pid);
                return;
            }
            // initialize the worker with the config and other important values
            const message = new Message(null, EventKeys.config, {
                cwd: this.fs.getWorkspacePath(),
                env: this.config.getEnv(),
                buildVersion: this.config.getBuildVersion(),
                args: this.args,
            });
            workerObject.worker.send(message);
        });

        // if any of the worker process dies then start a new one by simply forking another one
        cluster.on('exit', (worker, code, signal) => {
            // 15 is terminated, will be caused of the worker self, when memory limit is near => self healing
            if (code != 15) {
                this.output.err('worker PID', worker.process.pid, 'died with code: ' + code + ', and signal: ' + signal);
            }
            this.removeWorker(worker.process.pid);
            // @TODO check if worker was busy and move the task to another worker
            this.createWorker();
        });
    },
};
