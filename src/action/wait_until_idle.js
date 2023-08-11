import { WorkerStatus } from '../struc/worker_status.js';
import { nano_to_milli } from '../utils/convert.js';
import { Logger } from '../utils/logger.js';
import { WorkerController } from '../worker/controller.js';

// 1800s = 30min
export async function wait_until_idle(emergency_timeout_seconds = 1800) {
    const start = process.hrtime.bigint();
    Logger.debug('waited', nano_to_milli(process.hrtime.bigint() - start));
    const worker_amount = WorkerController.get_worker_amount();

    // check in an interval if all workers are idle
    return new Promise((resolve, reject) => {
        const complete = () => {
            Logger.debug('waited', nano_to_milli(process.hrtime.bigint() - start));
            clearInterval(interval);
            resolve();
        };
        const interval = setInterval(() => {
            const idle_workers_amount = WorkerController.get_workers_by_status(WorkerStatus.idle).length
            if (worker_amount == idle_workers_amount) {
                clearTimeout(emergency);
                complete();
            }
        }, 10);
        if (worker_amount == WorkerController.get_workers_by_status(WorkerStatus.idle).length) {
            complete();
            return;
        }
        // emergency break
        const emergency = setTimeout(() => {
            clearInterval(interval);
            Logger.error('emergency stop, waited', nano_to_milli(process.hrtime.bigint() - start));
            reject();
            process.exit(1);
        }, emergency_timeout_seconds * 1000);
    });
}
