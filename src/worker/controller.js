import { cpus } from 'os';
import { Worker } from '../model/worker.js';
import { Logger } from '../utils/logger.js';
import { filled_array, filled_string, is_null, is_number, is_bool, is_object } from '../utils/validate.js';
import { search_segment } from '../utils/segment.js';
import { Event } from '../utils/event.js';
import { WorkerAction } from '../struc/worker_action.js';
import { get_name, WorkerStatus } from '../struc/worker_status.js';
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

export class WorkerController {
    static create_workers(amount, fork_fn) {
        this.workers = [];
        for (let i = amount; i > 0; i--) {
            this.workers.push(this.create(fork_fn));
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
        if(!this.is_worker(worker)) {
            return undefined;
        }
        // creating workers and pushing reference in an array
        // these references can be used to receive messages from workers

        // to receive messages from worker process
        worker.process.on('message', (msg) => {
            Logger.debug('process', worker.pid, 'message', msg);
            const current_worker = this.get_message(msg);
            if (!is_bool(current_worker)) {
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
            this.workers.push(this.create());
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
                const name = get_name(data);
                if (!name) {
                    Logger.error('unknown state', data, pid_text);
                    return false;
                }
                worker.status = data;
                Logger.info(`status`, name, pid_text);
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
        if (!this.is_worker(worker)) {
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
                return true;
            }
        }
        return false;
        // this.events.emit('worker_status', worker.status, worker);
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
}
WorkerController.workers = [];
WorkerController.worker_ratio = 0;
