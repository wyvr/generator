import { cpus } from 'os';
import { Worker } from '../model/worker.js';
import { Logger } from '../utils/logger.js';
import { filled_array, filled_string, is_null, is_number, is_object, is_int } from '../utils/validate.js';
import { search_segment } from '../utils/segment.js';
import { Event } from '../utils/event.js';
import { get_name, WorkerAction } from '../struc/worker_action.js';
import { get_name as get_status_name, WorkerStatus } from '../struc/worker_status.js';
import { get_name as get_emit_name } from '../struc/worker_emit.js';
import { get_type_name } from '../struc/log.js';
import { inject_worker_message_errors } from '../utils/error.js';
import { Env } from '../vars/env.js';
import { Queue } from '../model/queue.js';
import { get_configure_data } from '../action/configure.js';
import { sleep } from '../utils/sleep.js';

export class WorkerController {
    static create_workers(amount, fork_fn) {
        this.workers = [];
        for (let i = amount; i > 0; i--) {
            const worker = this.create(fork_fn);
            if (this.is_worker(worker)) {
                this.workers.push(worker);
            }
        }
        this.worker_amount = this.workers.length;
        return this.workers;
    }
    static async single_threaded() {
        WorkerController.set_multi_threading(false);
        WorkerController.create_workers(1, () => {
            return {
                pid: process.pid,
                on: (key, fn) => {
                    Event.on('master', key, async (...args) => {
                        await fn(...args);
                    });
                },
            };
        });
        // only import when needed
        const { NoWorker } = await import('../no_worker.js');
        NoWorker();
    }
    static set_worker_ratio(ratio) {
        if (!is_number(ratio) || ratio < 0 || ratio > 1) {
            Logger.warning(`invalid worker ratio ${ratio}`);
            return;
        }
        this.worker_ratio = ratio;
    }
    static get_worker_amount_from_ratio() {
        if (this.worker_amount) {
            return this.worker_amount;
        }
        if (this.max_cores) {
            return this.max_cores;
        }
        // single threaded mode
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
    static get_worker_amount() {
        const amount = this.get_worker_amount_from_ratio();
        return amount;
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
            if (this.exiting) {
                return;
            }
            Logger.warning('worker died PID', worker.pid);
            Logger.info('create new worker');
            this.remove_worker(worker.pid);
            this.workers.push(this.create(fork_fn));
        });
        return worker;
    }
    static exit() {
        this.exiting = true;
        Logger.debug('killing', this.workers.length, 'workers');
        if (!this.multi_threading) {
            return;
        }
        this.workers.forEach((worker) => {
            process.kill(worker.pid);
        });
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
                const workers = this.get_workers_by_status(WorkerStatus.idle);
                if (Env.is_debug()) {
                    Logger.debug(
                        `status`,
                        name,
                        pid_text,
                        'idle workers',
                        workers.length,
                        this.workers.map((worker) => {
                            return get_status_name(worker.status);
                        })
                    );
                }
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
                this.send_action(worker, WorkerAction.configure, get_configure_data());
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
        if (!this.multi_threading) {
            setTimeout(() => {
                Event.emit('process', 'message', data);
            }, 100);
            return true;
        }
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
    /**
     * set global available key value in all workers
     * WARNING: can cause memory leak, when not cleared
     * @param {string} key
     * @param {any} value
     * @returns whether the value was sent to the workers or not
     */
    static set_all_workers(key, value) {
        if (!filled_string(key)) {
            return false;
        }
        this.workers.forEach((worker) => {
            this.send_action(worker, WorkerAction.set, { key, value });
        });
        return true;
    }

    /**
     * set config cache in all workers
     * @param {string} segment
     * @param {any} value
     * @returns whether the value was sent to the workers or not
     */
    static set_config_cache_all_workers(segment, value) {
        if (!filled_string(segment)) {
            return false;
        }
        if (this.multi_threading) {
            this.workers.forEach((worker) => {
                this.send_action(worker, WorkerAction.set_config_cache, { segment, value });
            });
        }
        return true;
    }

    static get_workers_by_status(status) {
        const name = get_status_name(status);
        if (is_null(name)) {
            return [];
        }
        return this.workers.filter((worker) => worker.status === status);
    }

    /**
     * Process the given queue by sending the data to the worker
     * @param {QueueEntry[]} queue
     * @returns whether the execution is complete, no next tick needed
     */
    static tick(queue) {
        if (is_null(queue)) {
            return true;
        }
        const workers = this.get_workers_by_status(WorkerStatus.idle);
        // stop when queue is empty and all workers are idle
        if (queue.length == 0 && workers.length == this.get_worker_amount()) {
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
                        this.send_action(worker, queue_entry.action, queue_entry.data);
                    }
                });
            }
        }
        return false;
    }

    static async process_data(action, data) {
        const name = get_name(action);
        if (!name) {
            Logger.error('unknown action', action);
            return false;
        }
        const workers = this.get_workers_by_status(WorkerStatus.idle);
        return new Promise((resolve) => {
            // retry when no idle workers are available
            if (workers.length == 0) {
                setTimeout(() => {
                    this.process_data(action, data).then(resolve);
                }, 50);
                return;
            }
            workers[0].status = WorkerStatus.busy;
            this.send_action(workers[0], action, data);
            const done_listener_id = Event.on('worker_status', WorkerStatus.done, (worker) => {
                if (worker.pid == workers[0].pid) {
                    Event.off('worker_status', WorkerStatus.done, done_listener_id);
                    resolve(true);
                }
            });
        });
    }

    static async process_in_workers(action, list, batch_size, show_name) {
        if (this.workers.length == 0) {
            Logger.error('no worker available');
            process.exit(1);
        }
        const name = get_name(action);
        if (!name) {
            Logger.error('unknown action', action);
            return false;
        }
        // wait some time that the events can catch up
        await sleep(50);
        const amount = list.length;
        if (amount == 0) {
            Logger.improve('no items to process, batch size', Logger.color.cyan(batch_size.toString()));
            return true;
        }
        if (!is_int(batch_size)) {
            batch_size = 10;
        }
        // @NOTE @TODO batches are not correctly handled in single threaded mode, so handle all items in one batch
        if (!this.multi_threading) {
            batch_size = amount;
        }
        Logger.info(
            'process',
            amount,
            amount == 1 ? 'item' : 'items',
            show_name ? Logger.color.blue(`in ${name}`) : '',
            Logger.color.dim('batch size ' + batch_size)
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
            const listener_id = Event.on('worker_status', WorkerStatus.idle, async () => {
                if (this.tick(this.queue)) {
                    Event.off('worker_status', WorkerStatus.idle, listener_id);
                    // wait some time that the events can catch up
                    await sleep(50);
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
                if (done >= size) {
                    Event.off('worker_status', WorkerStatus.done, done_listener_id);
                }
            });
        });
    }
    static set_multi_threading(value) {
        this.multi_threading = !!value;
    }
}
WorkerController.exiting = false;
WorkerController.workers = [];
WorkerController.worker_ratio = 0;
WorkerController.multi_threading = true;
