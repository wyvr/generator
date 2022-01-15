import { Config } from '@lib/config';
import { WorkerStatus } from '@lib/struc/worker/status';
import { WorkerAction } from '@lib/struc/worker/action';

import { Logger } from '@lib/logger';
import { Env } from '@lib/env';
import { WorkerModel } from '@lib/model/worker';
import { LogType } from '@lib/struc/log';
import { Events } from '@lib/events';
import { Error } from '@lib/error';
import { Queue } from '@lib/queue';
import { Cwd } from '@lib/vars/cwd';
import { ReleasePath } from '@lib/vars/release_path';
import { cpus } from 'os';
import { ILoggerObject } from '@lib/interface/logger';
import { WorkerEmit } from '@lib/struc/worker/emit';

export class WorkerController {
    private workers: WorkerModel[] = [];
    private worker_ratio = Config.get('worker.ratio');
    private max_cores: number;
    public events: Events = new Events();
    private queue: Queue = null;
    private worker_amount: number = null;
    public socket_port: number = null;

    constructor() {
        Env.set(process.env.WYVR_ENV);
        this.worker_amount = this.get_worker_amount();
    }

    get_worker_amount(): number {
        if (this.worker_amount) {
            return this.worker_amount;
        }
        if (this.max_cores) {
            return this.max_cores;
        }
        // get amount of cores
        // at least one and left 1 core for the main worker
        const cpu_cores = cpus().length;
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
        worker.process.on('close', () => {
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
        if (typeof msg == 'string' || msg.pid == null || msg.data == null || msg.data.action == null || msg.data.action.key == null || msg.data.action.value == null) {
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
                        data.messages = data.messages.map((message: ILoggerObject | string, index: number) => {
                            if (index == 0 && typeof message == 'string') {
                                return Logger.color.dim(message);
                            }
                            if (message == null) {
                                return message;
                            }
                            // ssr errors
                            if (typeof message == 'object' && message.code == 'parse-error' && message.frame && message.start && message.name) {
                                return `\n${message.name} ${Logger.color.dim('Line:')}${message.start.line}${Logger.color.dim(' Col:')}${message.start.column}\n${message.frame}`;
                            }
                            // rollup errors
                            if (typeof message == 'object' && message.code == 'PARSE_ERROR' && message.frame && message.loc) {
                                return `\n${message.code} ${Logger.color.dim('in')} ${message.loc.file}\n${Logger.color.dim('Line:')}${message.loc.line}${Logger.color.dim(
                                    ' Col:'
                                )}${message.loc.column}\n${message.frame}`;
                            }
                            // nodejs error
                            if (typeof message == 'object' && message.error) {
                                return Error.get(message.error, message.filename);
                            }
                            return message;
                        });
                    }
                    Logger[LogType[data.type]](...data.messages, Logger.color.dim(`PID ${msg.pid}`));
                }
                break;
            case WorkerAction.emit:
                if (data.type && WorkerEmit[data.type]) {
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
            cwd: Cwd.get(),
            release_path: ReleasePath.get(),
            socket_port: this.socket_port
        });
    }
    ticks = 0;
    tick(queue: Queue): boolean {
        const workers = this.get_idle_workers();
        Logger.debug('tick', this.ticks, 'idle workers', workers.length, 'queue', queue.length);
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
                        this.send_action(worker.pid, queue_entry.action, queue_entry.data);
                    }
                });
            }
        }
        return false;
    }
    // eslint-disable-next-line
    async process_in_workers(name: string, action: WorkerAction, list: any[], batch_size = 10): Promise<boolean> {
        const amount = list.length;
        Logger.info('process', amount, `${amount == 1 ? 'item' : 'items'}, batch size`, Logger.color.cyan(batch_size.toString()));
        // create new queue
        this.queue = new Queue();

        // correct batch size when there are more workers available
        const worker_based_batch_size = Math.ceil(list.length / this.get_worker_amount());
        if (worker_based_batch_size > list.length / batch_size && worker_based_batch_size < batch_size) {
            batch_size = worker_based_batch_size;
        }

        const iterations = Math.ceil(amount / batch_size);
        Logger.debug('process iterations', iterations);

        for (let i = 0; i < iterations; i++) {
            const queue_data = {
                action,
                data: list.slice(i * batch_size, (i + 1) * batch_size),
            };
            this.queue.push(queue_data);
        }
        const size = this.queue.length;
        let done = 0;
        return new Promise((resolve) => {
            const idle = this.get_idle_workers();
            const listener_id = this.events.on('worker_status', WorkerStatus.idle, () => {
                if (this.tick(this.queue)) {
                    this.events.off('worker_status', WorkerStatus.idle, listener_id);
                    resolve(true);
                }
            });
            // when all workers are idle, emit on first
            if (idle.length > 0 && idle.length == this.get_worker_amount()) {
                this.livecycle(idle[0]);
            }
            const done_listener_id = this.events.on('worker_status', WorkerStatus.done, () => {
                Logger.text(name, Logger.color.dim('...'), `${Math.round((100 / size) * done)}%`, Logger.color.dim(`${done}/${size}`));
                done++;
                if (done == size) {
                    this.events.off('worker_status', WorkerStatus.done, done_listener_id);
                }
            });
        });
    }
}
