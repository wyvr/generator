import { cpus } from 'os';
import { Worker } from '../model/worker.js';
import { Logger } from '../utils/logger.js';
import { is_float } from '../utils/validate.js';

export class WorkerController {
    static create_workers(amount) {
        this.workers = [];
        for (let i = amount; i > 0; i--) {
            this.workers.push(this.create());
        }
        return this.workers;
    }
    static set_worker_ratio(ratio) {
        if (!is_float(ratio) || ratio < 0 || ratio > 1) {
            Logger.warning('invalid worker ratio', ratio);
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
            // this.get_message(msg);
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
            // this.remove_worker(worker.pid);
            // this.workers.push(this.create());
        });
        return worker;
    }
    
}
WorkerController.workers = [];
WorkerController.worker_ratio = 0;
