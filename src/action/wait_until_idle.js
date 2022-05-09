import { WorkerStatus } from '../struc/worker_status.js';
import { WorkerController } from '../worker/controller.js';

// 1800s = 30min
export async function wait_until_idle(emergency_timeout_seconds = 1800) {
    const worker_amount = WorkerController.get_worker_amount();
    // check in an interval if all workers are idle
    return new Promise((resolve, reject) => {
        if (worker_amount == WorkerController.get_workers_by_status(WorkerStatus.idle).length) {
            resolve();
            return;
        }
        const interval = setInterval(() => {
            if (worker_amount == WorkerController.get_workers_by_status(WorkerStatus.idle).length) {
                clearInterval(interval);
                clearTimeout(emergency);
                resolve();
            }
        }, 10);
        // emergency break
        const emergency = setTimeout(() => {
            clearInterval(interval);
            reject();
            process.exit(1);
        }, emergency_timeout_seconds * 1000);
    });
}
