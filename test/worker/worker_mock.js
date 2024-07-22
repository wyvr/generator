import { WorkerStatus } from '../../src/struc/worker_status.js';
import { Event } from '../../src/utils/event.js';
import { WorkerController } from '../../src/worker/controller.js';

// biome-ignore lint/complexity/noStaticOnlyClass:
export class WorkerMock {
    static worker(pid) {
        return {
            pid,
            status: WorkerStatus.idle,
            process: {
                send: (data) => {
                    WorkerMock.data.push(data);
                    setTimeout(() => {
                        WorkerController.workers.find((ref_worker) => {
                            if (ref_worker.pid === pid) {
                                ref_worker.status = WorkerStatus.done;
                                return true;
                            }
                        });
                        Event.emit('worker_status', WorkerStatus.done, {
                            worker: { pid },
                            action: data?.action?.key
                        });
                        setTimeout(() => {
                            WorkerController.workers.find((ref_worker) => {
                                if (ref_worker.pid === pid) {
                                    ref_worker.status = WorkerStatus.idle;
                                    return true;
                                }
                            });
                            Event.emit('worker_status', WorkerStatus.idle, {
                                worker: { pid },
                            });
                        }, 1);
                    }, 1);
                },
            },
        };
    }

    static workers(amount) {
        WorkerController.worker_amount = amount;
        WorkerController.workers = new Array(amount)
            .fill(true)
            .map((item, index) => {
                const pid = 1000 + index;
                return WorkerMock.worker(pid);
            });
    }

    static reset() {
        WorkerMock.data = [];
        WorkerController.worker_amount = undefined;
        WorkerController.workers = [];
        WorkerController.worker_ratio = 0;
    }
}
WorkerMock.data = [];
