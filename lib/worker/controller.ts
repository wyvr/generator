import { Config } from '@lib/config';
import { WorkerStatus } from '@lib/model/worker/status';
import { WorkerAction } from '@lib/model/worker/action';

import { Logger } from '@lib/logger';
import { Env } from '@lib/env';
import { WorkerModel } from '@lib/model/worker/worker';
import { File } from '@lib/file';
import { LogType } from '@lib/model/log';
import { Events } from '@lib/events';

export class WorkerController {
    private cwd = process.cwd();
    private workers: WorkerModel[] = [];
    private worker_ratio = Config.get('worker.ratio');
    private max_cores: number;
    private listeners_status: any = {};
    private listeners_emit: any = {};
    private listener_auto_increment = 0;
    private on_entrypoint_callbacks: Function[] = [];
    private on_route_callbacks: Function[] = [];
    public events: Events = new Events();

    constructor(public global_data: any) {
        Env.set(process.env.WYVR_ENV);
    }

    get_worker_amount(): number {
        if (this.max_cores) {
            return this.max_cores;
        }
        // get amount of cores
        // at least one and left 1 core for the main worker
        const cpu_cores = require('os').cpus().length;
        const cpu_cores_ratio = Math.round(cpu_cores * this.worker_ratio);
        const max_cores = Math.max(1, cpu_cores_ratio - 1);

        // store the value
        this.max_cores = max_cores;
        return max_cores;
    }
    create() {
        const worker = new WorkerModel();
        // creating workers and pushing reference in an array
        // these references can be used to receive messages from workers

        // to receive messages from worker process
        worker.process.on('message', (msg) => {
            Logger.debug('process', worker.pid, 'message', msg);
            this.get_message(msg);
        });
        worker.process.on('error', (msg) => {
            Logger.error('process', worker.pid, 'error', msg);
        });
        worker.process.on('disconnect', () => {
            Logger.debug('process', worker.pid, 'disconnect');
        });
        worker.process.on('exit', (code) => {
            Logger.debug('process', worker.pid, 'exit', code);
        });
        worker.process.on('close', (code) => {
            Logger.warning('worker died PID', worker.pid);
            Logger.info('create new worker');
            this.remove_worker(worker.pid);
            this.workers.push(this.create());
        });
        return worker;
    }
    remove_worker(pid) {
        this.workers = this.workers.filter((worker) => worker.pid != pid);
    }
    create_workers(amount) {
        this.workers = [];
        for (let i = amount; i > 0; i--) {
            this.workers.push(this.create());
        }
        return this.workers;
    }
    get_worker(pid) {
        return this.workers.find((worker) => worker.pid == pid);
    }
    get_message(msg) {
        if (
            typeof msg == 'string' ||
            msg.pid == null ||
            msg.data == null ||
            msg.data.action == null ||
            msg.data.action.key == null ||
            msg.data.action.value == null
        ) {
            return;
        }
        const worker = this.get_worker(msg.pid);
        if (!worker) {
            Logger.error('unknown worker', msg.pid);
        }
        const action = msg.data.action.key;
        const data = msg.data.action.value;
        switch (action) {
            case WorkerAction.status:
                if (typeof WorkerStatus[data] != 'string') {
                    Logger.error('unknown state', data, 'for worker', msg.pid);
                    return;
                }
                worker.status = data;
                Logger.debug(`status`, WorkerStatus[data], Logger.color.dim(`PID ${msg.pid}`));
                break;
            case WorkerAction.log:
                if (data && data.type && LogType[data.type] && Logger[LogType[data.type]]) {
                    // display svelte errors with better output
                    if (data.messages.length > 0 && data.messages[0] === '[svelte]') {
                        data.messages = data.messages.map((message: any, index: number) => {
                            if (index == 0) {
                                return Logger.color.dim(message);
                            }
                            // ssr errors
                            if (typeof message == 'object' && message.code == 'parse-error' && message.frame && message.start && message.name) {
                                return `\n${message.name} ${Logger.color.dim('Line:')}${message.start.line}${Logger.color.dim(' Col:')}${
                                    message.start.column
                                }\n${message.frame}`;
                            }
                            // rollup errors
                            if (typeof message == 'object' && message.code == 'PARSE_ERROR' && message.frame && message.loc) {
                                return `\n${message.code} ${Logger.color.dim('in')} ${message.loc.file}\n${Logger.color.dim('Line:')}${
                                    message.loc.line
                                }${Logger.color.dim(' Col:')}${message.loc.column}\n${message.frame}`;
                            }
                            return message;
                        });
                    }
                    Logger[LogType[data.type]](...data.messages, Logger.color.dim(`PID ${msg.pid}`));
                }
                break;
            case WorkerAction.emit:
                if (data.type && ['entrypoint', 'route', 'global'].indexOf(data.type) > -1 ) {
                    this.events.emit('emit', data.type, data);
                }
                break;
        }
        this.livecycle(worker);
    }
    get_idle_workers() {
        return this.workers.filter((worker) => worker.status == WorkerStatus.idle);
    }
    send_status(pid, status) {
        Logger.warning('really?! the status comes from the worker itself, worker:', pid, 'status', status, WorkerStatus[status]);
        this.send_action(pid, WorkerAction.status, status);
    }
    send_action(pid, action, data) {
        this.send_message(pid, {
            action: {
                key: action,
                value: data,
            },
        });
    }
    send_message(pid, data) {
        if (!pid) {
            return;
        }
        const worker = this.get_worker(pid);
        if (!worker) {
            Logger.warning('can not send message to worker', pid);
            return;
        }
        if (!data) {
            Logger.warning('can not send empty message to worker', pid);
            return;
        }
        worker.process.send(data);
    }
    livecycle(worker) {
        if (!worker || !worker.pid) {
            return;
        }
        if (worker.status == WorkerStatus.exists) {
            // configure the worker
            this.configure(worker);
        }
        this.events.emit('worker_status', worker.status, worker);
    }
    cleanup() {
        this.workers.forEach((worker) => {
            this.send_action(worker.pid, WorkerAction.cleanup, true);
        });
    }
    configure(worker) {
        this.send_action(worker.pid, WorkerAction.configure, {
            config: Config.get(),
            env: Env.get(),
            cwd: this.cwd,
            global_data: this.global_data,
        });
    }
}
