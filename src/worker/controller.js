import { cpus } from 'os';
import { Worker } from '../model/worker.js';
import { Logger } from '../utils/logger.js';
import { filled_string, is_number } from '../utils/validate.js';
import { search_segment } from '../utils/segment.js';
import { WorkerAction } from '../struc/worker_action.js';
import { get_name, WorkerStatus } from '../struc/worker_status.js';

export class WorkerController {
    static create_workers(amount) {
        this.workers = [];
        for (let i = amount; i > 0; i--) {
            this.workers.push(this.create());
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
        if (this.worker_ratio <= 0) {
            return 1;
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
    static create() {
        const worker = Worker();
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
    static remove_worker(pid) {
        this.workers = this.workers.filter((worker) => worker.pid != pid);
    }
    static get_worker(pid) {
        return this.workers.find((worker) => worker.pid == pid);
    }
    static get_message(msg) {
        if (
            filled_string(msg) ||
            !search_segment(msg, 'data.action.key') ||
            !search_segment(msg, 'data.action.value')
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
            case WorkerAction.status: {
                const name = get_name(data);
                if (!name) {
                    Logger.error('unknown state', data, 'for worker', msg.pid);
                    return;
                }
                worker.status = data;
                Logger.info(`status`, name, Logger.color.dim(`PID ${msg.pid}`));
                break;
            }
            case WorkerAction.log:
                if (data && data.type) {
                    //&& LogType[data.type] && Logger[LogType[data.type]]
                    // display svelte errors with better output
                    // if (data.messages.length > 0 && data.messages[0] === '[svelte]') {
                    //     data.messages = data.messages.map((message, index) => {
                    //         if (index == 0 && typeof message == 'string') {
                    //             return Logger.color.dim(message);
                    //         }
                    //         if (message == null) {
                    //             return message;
                    //         }
                    //         // ssr errors
                    //         if (
                    //             typeof message == 'object' &&
                    //             message.code == 'parse-error' &&
                    //             message.frame &&
                    //             message.start &&
                    //             message.name
                    //         ) {
                    //             return `\n${message.name} ${Logger.color.dim('Line:')}${
                    //                 message.start.line
                    //             }${Logger.color.dim(' Col:')}${message.start.column}\n${message.frame}`;
                    //         }
                    //         // rollup errors
                    //         if (
                    //             typeof message == 'object' &&
                    //             message.code == 'PARSE_ERROR' &&
                    //             message.frame &&
                    //             message.loc
                    //         ) {
                    //             return `\n${message.code} ${Logger.color.dim('in')} ${
                    //                 message.loc.file
                    //             }\n${Logger.color.dim('Line:')}${message.loc.line}${Logger.color.dim(' Col:')}${
                    //                 message.loc.column
                    //             }\n${message.frame}`;
                    //         }
                    //         // nodejs error
                    //         if (typeof message == 'object' && message.error) {
                    //             return Error.get(message.error, message.filename);
                    //         }
                    //         return message;
                    //     });
                    // }
                    Logger.info(data.type, ...data.messages, Logger.color.dim(`PID ${msg.pid}`));
                    // Logger[LogType[data.type]](...data.messages, Logger.color.dim(`PID ${msg.pid}`));
                }
                break;
            case WorkerAction.emit:
                // if (data.type && WorkerEmit[data.type]) {
                //     this.events.emit('emit', data.type, data);
                // }
                Logger.info('emit', data.type, data, Logger.color.dim(`PID ${msg.pid}`));
                break;
        }
        this.livecycle(worker);
    }
    static livecycle(worker) {
        if (!worker || !worker.pid) {
            return;
        }
        if (worker.status == WorkerStatus.exists) {
            // configure the worker
            // this.configure(worker);
        }
        // this.events.emit('worker_status', worker.status, worker);
    }
}
WorkerController.workers = [];
WorkerController.worker_ratio = 0;
