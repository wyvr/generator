import os from 'os';
import { Worker } from '../model/worker.js';
import { Logger } from '../utils/logger.js';
import {
    filled_array,
    filled_string,
    is_null,
    is_number,
    is_object,
    is_int,
    is_func,
} from '../utils/validate.js';
import { search_segment } from '../utils/segment.js';
import { Event } from '../utils/event.js';
import { get_name, WorkerAction } from '../struc/worker_action.js';
import {
    get_name as get_status_name,
    WorkerStatus,
} from '../struc/worker_status.js';
import { get_name as get_emit_name } from '../struc/worker_emit.js';
import { get_type_name } from '../struc/log.js';
import { inject_worker_message_errors } from '../utils/error.js';
import { Env } from '../vars/env.js';
import { Queue } from '../model/queue.js';
import { get_configure_data } from '../action/configure.js';
import { sleep } from '../utils/sleep.js';

let die_counter = 0;
let cpu_cores;
// biome-ignore lint/complexity/noStaticOnlyClass:
export class WorkerController {
    static async initialize(
        ratio = 1,
        single_threaded = false,
        fork_fn = undefined
    ) {
        // set worker ratio
        WorkerController.set_worker_ratio(ratio);

        if (single_threaded) {
            Logger.warning(
                'running in single threaded mode, no workers will be started'
            );

            await WorkerController.single_threaded();
        } else {
            // Create the workers for the processing
            const worker_amount =
                WorkerController.get_worker_amount_from_ratio();
            WorkerController.worker_amount = worker_amount;
            Logger.present(
                'worker',
                worker_amount,
                Logger.color.dim(
                    `of ${WorkerController.get_cpu_cores()} threads`
                )
            );
            WorkerController.create_workers(worker_amount, fork_fn);
        }
    }
    static create_workers(amount, fork_fn = undefined) {
        WorkerController.workers = [];
        for (let i = amount; i > 0; i--) {
            const worker = WorkerController.create(fork_fn);
            if (WorkerController.is_worker(worker)) {
                WorkerController.workers.push(worker);
            } else {
                Logger.warning('worker is invalid', worker);
            }
        }
        WorkerController.worker_amount = WorkerController.workers.length;
        return WorkerController.workers;
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
        WorkerController.worker_ratio = ratio;
    }
    static get_cpu_cores() {
        if (cpu_cores) {
            return cpu_cores;
        }
        if (is_func(os.availableParallelism)) {
            cpu_cores = os.availableParallelism();
        } else {
            cpu_cores = os.cpus().length;
        }
        return cpu_cores;
    }
    static get_worker_amount_from_ratio() {
        if (WorkerController.worker_amount) {
            return WorkerController.worker_amount;
        }
        if (WorkerController.max_cores) {
            return WorkerController.max_cores;
        }
        // single threaded mode
        if (WorkerController.worker_ratio <= 0) {
            return 1;
        }
        // get amount of cores
        // at least one and left 1 core for the main worker
        const cpu_cores = WorkerController.get_cpu_cores();
        const cpu_cores_ratio = Math.round(
            cpu_cores * WorkerController.worker_ratio
        );
        const max_cores = Math.max(1, cpu_cores_ratio - 1);

        // store the value
        WorkerController.max_cores = max_cores;
        return max_cores;
    }
    static get_worker_amount() {
        const amount = WorkerController.get_worker_amount_from_ratio();
        return amount;
    }
    static create(fork_fn = undefined) {
        const worker = Worker(fork_fn);
        if (!WorkerController.is_worker(worker)) {
            return undefined;
        }
        // creating workers and pushing reference in an array
        // these references can be used to receive messages from workers

        // to receive messages from worker process
        worker.process.on('message', (msg) => {
            Logger.debug('process', worker.pid, 'message', msg);
            const current_worker = WorkerController.get_message(msg);
            if (current_worker !== false) {
                WorkerController.livecycle(worker);
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
            if (WorkerController.exiting) {
                return;
            }
            const cpu = WorkerController.get_cpu_cores();
            die_counter++;
            Logger.warning(
                'create new worker because of exit from',
                worker.pid,
                code
            );
            WorkerController.remove_worker(worker.pid);
            // wait some time before respawning, otherwise in total broken states the server will run at 100% cpu and is not responsive
            setTimeout(() => {
                if (die_counter > cpu * 2) {
                    Logger.error(
                        `Suicide: ${die_counter} workers died in the last second, which brings the application into an unhealthy state, shutting down`
                    );
                    process.exit(1);
                }
                WorkerController.workers.push(WorkerController.create(fork_fn));
                die_counter--;
            }, 1000);
        });
        worker.process.on('close', () => {
            if (WorkerController.exiting) {
                return;
            }
            Logger.info('create new worker because of close from', worker.pid);
            WorkerController.remove_worker(worker.pid);
            WorkerController.workers.push(WorkerController.create(fork_fn));
        });
        return worker;
    }
    static exit() {
        WorkerController.exiting = true;
        Logger.debug('killing', WorkerController.workers.length, 'workers');
        if (!WorkerController.multi_threading) {
            return;
        }
        for (const worker of WorkerController.workers) {
            process.kill(worker.pid);
        }
        WorkerController.worker_amount = undefined;
        WorkerController.max_cores = undefined;

        WorkerController.workers = [];
        WorkerController.worker_ratio = 0;
    }
    static remove_worker(pid) {
        WorkerController.workers = WorkerController.workers.filter(
            (worker) => worker.pid !== pid
        );
    }
    static get_worker(pid) {
        return WorkerController.workers.find((worker) => worker.pid === pid);
    }
    static get_message(msg) {
        if (
            filled_string(msg) ||
            is_null(search_segment(msg, 'data.action.key')) ||
            is_null(search_segment(msg, 'data.action.value'))
        ) {
            return false;
        }
        const worker = WorkerController.get_worker(msg.pid);
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
                WorkerController.workers.find((ref_worker) => {
                    if (ref_worker.pid === worker.pid) {
                        ref_worker.status = data;
                        return true;
                    }
                });
                // worker.status = data;
                const workers = WorkerController.get_workers_by_status(
                    WorkerStatus.idle
                );
                if (Env.is_debug()) {
                    Logger.debug(
                        'status',
                        name,
                        pid_text,
                        'idle workers',
                        workers.length,
                        WorkerController.workers.map((worker) => {
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
        if (
            !WorkerController.is_worker(worker) ||
            !get_status_name(worker.status)
        ) {
            return false;
        }
        switch (worker.status) {
            case WorkerStatus.exists: {
                WorkerController.send_action(
                    worker,
                    WorkerAction.configure,
                    get_configure_data()
                );
                break;
            }
        }
        Event.emit('worker_status', worker.status, worker);
        return true;
    }

    static is_worker(worker) {
        return (
            is_object(worker) &&
            is_number(worker.pid) &&
            !is_null(worker.process)
        );
    }

    static send_message(worker, data) {
        if (!WorkerController.multi_threading) {
            setTimeout(() => {
                Event.emit('process', 'message', data);
            }, 100);
            return true;
        }
        if (!WorkerController.is_worker(worker)) {
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
        WorkerController.send_message(worker, {
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
        WorkerController.send_action_all_workers(WorkerAction.set, {
            key,
            value,
        });
        return true;
    }

    /**
     * send action to all workers
     * @param {string} segment
     * @param {any} value
     * @returns whether the value was sent to the workers or not
     */
    static send_action_all_workers(action, data) {
        for (const worker of WorkerController.workers) {
            WorkerController.send_action(worker, action, data);
        }
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
        if (WorkerController.multi_threading) {
            WorkerController.send_action_all_workers(
                WorkerAction.set_config_cache,
                {
                    segment,
                    value,
                }
            );
        }
        return true;
    }

    static get_workers_by_status(status) {
        const name = get_status_name(status);
        if (is_null(name)) {
            return [];
        }
        return WorkerController.workers.filter(
            (worker) => worker.status === status
        );
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
        const workers = WorkerController.get_workers_by_status(
            WorkerStatus.idle
        );
        // stop when queue is empty and all workers are idle
        if (
            queue.length === 0 &&
            workers.length === WorkerController.get_worker_amount()
        ) {
            return true;
        }
        if (queue.length > 0) {
            // get all idle workers
            if (workers.length > 0) {
                for (const worker of workers) {
                    const queue_entry = queue.take();
                    if (queue_entry != null) {
                        // set worker busy otherwise the same worker gets multiple actions send
                        worker.status = WorkerStatus.busy;
                        // send the data to the worker
                        WorkerController.send_action(
                            worker,
                            queue_entry.action,
                            queue_entry.data
                        );
                    }
                }
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
        const workers = WorkerController.get_workers_by_status(
            WorkerStatus.idle
        );
        return new Promise((resolve) => {
            // retry when no idle workers are available
            if (workers.length === 0) {
                setTimeout(() => {
                    WorkerController.process_data(action, data).then(resolve);
                }, 50);
                return;
            }
            workers[0].status = WorkerStatus.busy;
            WorkerController.send_action(workers[0], action, data);
            const done_listener_id = Event.on(
                'worker_status',
                WorkerStatus.done,
                (worker) => {
                    if (worker.pid === workers[0].pid) {
                        Event.off(
                            'worker_status',
                            WorkerStatus.done,
                            done_listener_id
                        );
                        resolve(true);
                    }
                }
            );
        });
    }

    static async process_in_workers(action, list, batch_size, show_name) {
        if (WorkerController.workers.length === 0) {
            Logger.error('no worker available');
            process.exit(1);
        }
        const name = get_name(action);
        if (!name) {
            Logger.error('unknown action', action);
            return false;
        }
        // wait some time that the events can catch up
        if (!WorkerController.multi_threading) {
            await sleep(10);
        }
        const amount = list.length;
        if (amount === 0) {
            Logger.improve(
                'no items to process, batch size',
                Logger.color.cyan(batch_size.toString())
            );
            return true;
        }
        if (!is_int(batch_size)) {
            batch_size = 10;
        }
        // @NOTE @TODO batches are not correctly handled in single threaded mode, so handle all items in one batch
        if (!WorkerController.multi_threading) {
            batch_size = amount;
        }
        Logger.info(
            'process',
            amount,
            amount === 1 ? 'item' : 'items',
            show_name ? Logger.color.blue(`in ${name}`) : '',
            Logger.color.dim(`batch size ${batch_size}`)
        );

        // create new queue
        WorkerController.queue = new Queue();

        // correct batch size when there are more workers available
        const worker_based_batch_size = Math.ceil(
            list.length / WorkerController.get_worker_amount()
        );
        if (
            worker_based_batch_size > list.length / batch_size &&
            worker_based_batch_size < batch_size
        ) {
            batch_size = worker_based_batch_size;
        }

        const iterations = Math.ceil(amount / batch_size);
        Logger.debug('process iterations', iterations);

        for (let i = 0; i < iterations; i++) {
            const queue_data = {
                action,
                data: list.slice(i * batch_size, (i + 1) * batch_size),
            };
            WorkerController.queue.push(queue_data);
        }
        const size = WorkerController.queue.length;
        let done = 0;
        return new Promise((resolve) => {
            const idle = WorkerController.get_workers_by_status(
                WorkerStatus.idle
            );
            const listener_id = Event.on(
                'worker_status',
                WorkerStatus.idle,
                async () => {
                    if (WorkerController.tick(WorkerController.queue)) {
                        Event.off(
                            'worker_status',
                            WorkerStatus.idle,
                            listener_id
                        );
                        // wait some time that the events can catch up
                        if (!WorkerController.multi_threading) {
                            await sleep(10);
                        }
                        resolve(true);
                    }
                }
            );
            // when all workers are idle, emit on first
            if (
                idle.length > 0 &&
                idle.length === WorkerController.get_worker_amount()
            ) {
                WorkerController.livecycle(idle[0]);
            }
            const done_listener_id = Event.on(
                'worker_status',
                WorkerStatus.done,
                () => {
                    Logger.text(
                        name,
                        Logger.color.dim('...'),
                        `${Math.round((100 / size) * done)}%`,
                        Logger.color.dim(`${done}/${size}`)
                    );
                    done++;
                    if (done >= size) {
                        Event.off(
                            'worker_status',
                            WorkerStatus.done,
                            done_listener_id
                        );
                    }
                }
            );
        });
    }
    static set_multi_threading(value) {
        WorkerController.multi_threading = !!value;
    }
}
WorkerController.exiting = false;
WorkerController.workers = [];
WorkerController.worker_ratio = 0;
WorkerController.multi_threading = true;
