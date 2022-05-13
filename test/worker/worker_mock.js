import { WorkerStatus } from '../../src/struc/worker_status.js';
import { Event } from '../../src/utils/event.js';
import { WorkerController } from '../../src/worker/controller.js';

export class WorkerMock {
    static worker(pid) {
        return {
            pid,
            status: WorkerStatus.idle,
            process: {
                send: (data) => {
                    this.data.push(data);
                    setTimeout(() => {
                        WorkerController.workers.find((ref_worker) => {
                            if (ref_worker.pid == pid) {
                                ref_worker.status = WorkerStatus.done;
                                return true;
                            }
                        });
                        Event.emit('worker_status', WorkerStatus.done, { pid });
                        setTimeout(() => {
                            WorkerController.workers.find((ref_worker) => {
                                if (ref_worker.pid == pid) {
                                    ref_worker.status = WorkerStatus.idle;
                                    return true;
                                }
                            });
                            Event.emit('worker_status', WorkerStatus.idle, { pid });
                        }, 1);
                    }, 1);
                },
            },
        };
    }

    static workers(amount) {
        WorkerController.worker_amount = amount;
        WorkerController.workers = new Array(amount).fill(true).map((item, index) => {
            const pid = 1000 + index;
            return this.worker(pid);
        });
    }

    static reset() {
        this.data = [];
        WorkerController.worker_amount = undefined;
        WorkerController.workers = [];
        WorkerController.worker_ratio = 0;
    }
}
WorkerMock.data = [];
