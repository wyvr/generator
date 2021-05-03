const config = require('_lib/config');
const worker_status = require('_lib/model/worker/status');
const worker_action = require('_lib/model/worker/action');
const worker_ratio = config.get('worker.ratio');
const cluster = require('cluster');
const path = require('path');
const logger = require('_lib/logger');
const cwd = process.cwd();
const env = require('_lib/env');
env.set(process.env.WYVR_ENV);

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
        const instance = cluster.fork();
        const worker = {
            status: worker_status.undefined,
            pid: 0, // process id
            process: instance.process,
        };
        worker.pid = worker.process.pid;
        // creating workers and pushing reference in an array
        // these references can be used to receive messages from workers

        // to receive messages from worker process
        worker.process.on('message', (msg) => {
            logger.debug('process', worker.pid, 'message', msg);
            this.get_message(msg);
        });
        worker.process.on('error', (msg) => {
            logger.error('process', worker.pid, 'error', msg);
        });
        worker.process.on('disconnect', () => {
            logger.debug('process', worker.pid, 'disconnect');
        });
        worker.process.on('exit', (code) => {
            logger.debug('process', worker.pid, 'exit', code);
        });
        worker.process.on('close', (code) => {
            logger.warning('worker died PID', worker.pid);
            logger.info('create new worker');
            this.remove_worker(worker.pid);
            this.workers.push(this.create());
        });
        return worker;
    },
    remove_worker(pid) {
        this.workers = this.workers.filter((worker) => worker.pid != pid);
    },
    create_workers(amount) {
        this.workers = [];
        for (let i = amount; i > 0; i--) {
            this.workers.push(this.create());
        }
        return this.workers;
    },
    get_worker(pid) {
        return this.workers.find((worker) => worker.pid == pid);
    },
    get_message(msg) {
        if (typeof msg == 'string' || !msg.pid || !msg.data || !msg.data.action || !msg.data.action.key || !msg.data.action.value) {
            return;
        }
        const worker = this.get_worker(msg.pid);
        if (!worker) {
            logger.error('unknown worker', msg.pid);
        }
        const action = msg.data.action.key;
        const data = msg.data.action.value;
        switch (action) {
            case worker_action.status:
                if (typeof worker_status[data] != 'string') {
                    logger.error('unknown state', data, 'for worker', msg.pid);
                    return;
                }
                worker.status = data;
                logger.present(`status`, worker_status[data], logger.color.dim(`PID ${msg.pid}`));
                this.livecycle(worker);
                break;
        }
    },
    send_status(pid, status) {
        logger.warning('really?! the status comes from the worker itself, worker:', pid, 'status', status, worker_status[status]);
        this.send_action(pid, worker_action.status, status);
    },
    send_action(pid, action, data) {
        this.send_message(pid, {
            action: {
                key: action,
                value: data,
            },
        });
    },
    send_message(pid, data) {
        if (!pid) {
            return;
        }
        const worker = this.get_worker(pid);
        if (!worker) {
            logger.warning('can not send message to worker', pid);
            return;
        }
        if (!data) {
            logger.warning('can not send empty message to worker', pid);
            return;
        }
        worker.process.send(data);
    },
    livecycle(worker) {
        if (!worker || !worker.pid) {
            return;
        }
        if (worker.status == worker_status.exists) {
            // configure the worker
            this.send_action(worker.pid, worker_action.configure, {
                config: config.get(),
                env: env.get(),
                cwd,
            });
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
