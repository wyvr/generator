const config = require('@lib/config');
import { WorkerStatus } from '@lib/model/worker/status';
import { WorkerAction } from '@lib/model/worker/action';
const worker_ratio = config.get('worker.ratio');
import { fork } from 'cluster';
const logger = require('@lib/logger');
const cwd = process.cwd();
const env = require('@lib/env');
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
        const instance = fork();
        const worker = {
            status: WorkerStatus.undefined,
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
            case WorkerAction.status:
                if (typeof WorkerStatus[data] != 'string') {
                    logger.error('unknown state', data, 'for worker', msg.pid);
                    return;
                }
                worker.status = data;
                logger.present(`status`, WorkerStatus[data], logger.color.dim(`PID ${msg.pid}`));
                this.livecycle(worker);
                break;
        }
    },
    send_status(pid, status) {
        logger.warning('really?! the status comes from the worker itself, worker:', pid, 'status', status, WorkerStatus[status]);
        this.send_action(pid, WorkerAction.status, status);
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
        if (worker.status == WorkerStatus.exists) {
            // configure the worker
            this.send_action(worker.pid, WorkerAction.configure, {
                config: config.get(),
                env: env.get(),
                cwd,
            });
        }
    },
};
