import { cpus } from 'os';
import { Worker } from '../model/worker.js';
import { Logger } from '../utils/logger.js';
import { filled_array, filled_string, is_null, is_number, is_object, is_int } from '../utils/validate.js';
import { search_segment } from '../utils/segment.js';
import { Event } from '../utils/event.js';
import { WorkerAction } from '../struc/worker_action.js';
import { get_name as get_status_name, WorkerStatus } from '../struc/worker_status.js';
import { get_name as get_emit_name } from '../struc/worker_emit.js';
import { get_type_name } from '../struc/log.js';
import { inject_worker_message_errors } from '../utils/error.js';
import { ReleasePath } from '../vars/release_path.js';
import { WyvrPath } from '../vars/wyvr_path.js';
import { Cwd } from '../vars/cwd.js';
import { Env } from '../vars/env.js';
import { Config } from '../utils/config.js';
import { UniqId } from '../vars/uniq_id.js';
import { Report } from '../vars/report.js';
import { to_string } from '../utils/to.js';
import { Queue } from '../model/queue.js';

export class WorkerController {
    static create_workers(amount, fork_fn) {
        this.workers = [];
        for (let i = amount; i > 0; i--) {
            const worker = this.create(fork_fn);
            if (this.is_worker(worker)) {
                this.workers.push(worker);
            }
        }
        return this.workers;
    }
    static set_worker_ratio(ratio) {
        if (!is_number(ratio) || ratio < 0 || ratio > 1) {
            Logger.warning(`invalid worker ratio ${ratio}`);
            return;
        }
        this.worker_ratio = ratio;
    }
    static get_worker_amount() {
        if (this.worker_amount) {
            return this.worker_amount;
        }
        if (this.max_cores) {
            return this.max_cores;
        }
        if (this.worker_ratio <= 0) {
            return 1;
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
    static create(fork_fn) {
        const worker = Worker(fork_fn);
        if (!this.is_worker(worker)) {
            return undefined;
        }
        // creating workers and pushing reference in an array
        // these references can be used to receive messages from workers

        // to receive messages from worker process
        worker.process.on('message', (msg) => {
            Logger.debug('process', worker.pid, 'message', msg);
            const current_worker = this.get_message(msg);
            if (current_worker !== false) {
                this.livecycle(worker);
            }
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
            this.workers.push(this.create(fork_fn));
        });
        return worker;
    }
    static remove_worker(pid) {
        this.workers = this.workers.filter((worker) => worker.pid != pid);
    }
    static get_worker(pid) {
        return this.workers.find((worker) => worker.pid == pid);
    }
    static get_message(msg) {
        if (
            filled_string(msg) ||
            is_null(search_segment(msg, 'data.action.key')) ||
            is_null(search_segment(msg, 'data.action.value'))
        ) {
            return false;
        }
        const worker = this.get_worker(msg.pid);
        if (!worker) {
            Logger.error('unknown worker', msg.pid);
            return false;
        }
        const action = msg.data.action.key;
        const data = msg.data.action.value;
        const pid_text = Logger.color.dim(`PID ${msg.pid}`);
        switch (action) {
            case WorkerAction.status: {
                const name = get_status_name(data);
                if (!name) {
                    Logger.error('unknown state', data, pid_text);
                    return false;
                }
                // update the status of the worker
                this.workers.find((ref_worker) => {
                    if (ref_worker.pid == worker.pid) {
                        ref_worker.status = data;
                        return true;
                    }
                });
                // worker.status = data;
                Logger.info(`status`, name, pid_text);
                const workers = this.get_workers_by_status(WorkerStatus.idle);
                Logger.info(
                    workers.length,
                    this.workers.map((worker) => {
                        return worker.status;
                    })
                );
                break;
            }
            case WorkerAction.log: {
                const log_type = get_type_name(data.type);
                if (!log_type || !filled_array(data.messages)) {
                    return false;
                }

                const messages = inject_worker_message_errors(data.messages);
                Logger.output_type(log_type, ...messages, pid_text);
                break;
            }
            case WorkerAction.emit: {
                const name = get_emit_name(data.type);
                if (!name) {
                    Logger.error('unknown emit', data, pid_text);
                    return false;
                }
                Event.emit('emit', name, data);
                Logger.debug('emit', name, data, pid_text);
                break;
            }
        }
        return worker;
    }
    static livecycle(worker) {
        if (!this.is_worker(worker) || !get_status_name(worker.status)) {
            return false;
        }
        switch (worker.status) {
            case WorkerStatus.exists: {
                this.send_action(worker, WorkerAction.configure, {
                    config: Config.get(),
                    env: Env.get(),
                    cwd: Cwd.get(),
                    release_path: ReleasePath.get(),
                    wyvr_path: WyvrPath.get(),
                    uniq_id: UniqId.get(),
                    report: Report.get(),
                    // socket_port: this.socket_port,
                });
                break;
            }
        }
        Event.emit('worker_status', worker.status, worker);
        return true;
    }

    static is_worker(worker) {
        return is_object(worker) && is_number(worker.pid) && !is_null(worker.process);
    }

    static send_message(worker, data) {
        if (!this.is_worker(worker)) {
            return false;
        }

        if (is_null(data)) {
            Logger.warning('can not send empty message to worker', worker.pid);
            return false;
        }
        worker.process.send(data);
        return true;
    }

    static send_action(worker, action, data) {
        this.send_message(worker, {
            action: {
                key: action,
                value: data,
            },
        });
        return false;
    }

    static get_workers_by_status(status) {
        const name = get_status_name(status);
        if (is_null(name)) {
            return [];
        }
        return this.workers.filter((worker) => worker.status === status);
    }

    static tick(queue) {
        const workers = this.get_workers_by_status(WorkerStatus.idle);
        // stop when queue is empty or all workers are idle
        if (queue.length == 0 && workers.length == this.worker_amount) {
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

    static async process_in_workers(name, action, list, batch_size) {
        if (this.workers.length == 0) {
            Logger.error('no worker available');
            process.exit(1);
            return;
        }
        const amount = list.length;
        if (amount == 0) {
            Logger.improve('no items to process, batch size', Logger.color.cyan(batch_size.toString()));
            return true;
        }
        if (!is_int(batch_size)) {
            batch_size = 10;
        }
        Logger.info(
            'process',
            amount,
            `${amount == 1 ? 'item' : 'items'}, batch size`,
            Logger.color.cyan(to_string(batch_size))
        );

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
            const idle = this.get_workers_by_status(WorkerStatus.idle);
            const listener_id = Event.on('worker_status', WorkerStatus.idle, () => {
                if (this.tick(this.queue)) {
                    Event.off('worker_status', WorkerStatus.idle, listener_id);
                    resolve(true);
                }
            });
            // when all workers are idle, emit on first
            if (idle.length > 0 && idle.length == this.get_worker_amount()) {
                this.livecycle(idle[0]);
            }
            const done_listener_id = Event.on('worker_status', WorkerStatus.done, () => {
                Logger.text(
                    name,
                    Logger.color.dim('...'),
                    `${Math.round((100 / size) * done)}%`,
                    Logger.color.dim(`${done}/${size}`)
                );
                done++;
                if (done == size) {
                    Event.off('worker_status', WorkerStatus.done, done_listener_id);
                }
            });
        });
    }
}
WorkerController.workers = [];
WorkerController.worker_ratio = 0;
