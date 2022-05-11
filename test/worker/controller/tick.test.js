import { deepStrictEqual, strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { Queue } from '../../../src/model/queue.js';
import { WorkerAction } from '../../../src/struc/worker_action.js';
import { WorkerStatus } from '../../../src/struc/worker_status.js';
import { WorkerController } from '../../../src/worker/controller.js';

describe('worker/controller/tick', () => {
    beforeEach(() => {
        WorkerController.workers = [];
    });
    afterEach(() => {
        WorkerController.workers = [];
    });
    it('no queue, no workers', () => {
        const result = WorkerController.tick();
        strictEqual(result, true);
    });
    it('queue, no workers', () => {
        let send_data = [];

        const queue = new Queue();
        queue.push({
            action: WorkerAction.status,
            data: WorkerStatus.undefined,
        });
        let result = WorkerController.tick(queue);
        strictEqual(result, false);
        deepStrictEqual(send_data, []);
    });
    it('queue, 1 worker', () => {
        let send_data = [];
        WorkerController.worker_amount = 1;
        WorkerController.workers = [
            {
                pid: 1000,
                status: WorkerStatus.idle,
                process: {
                    send: (data) => {
                        send_data.push(data);
                    },
                },
            },
        ];
        const queue = new Queue();
        queue.push({
            action: WorkerAction.status,
            data: WorkerStatus.undefined,
        });
        let result = WorkerController.tick(queue);
        strictEqual(result, false); // queue is not empty
        deepStrictEqual(send_data, [
            {
                action: {
                    key: WorkerAction.status,
                    value: WorkerStatus.undefined,
                },
            },
        ]);
    });
    it('empty queue, 1 worker', () => {
        let send_data = [];
        WorkerController.worker_amount = 1;
        WorkerController.workers = [
            {
                pid: 1000,
                status: WorkerStatus.idle,
                process: {
                    send: (data) => {
                        send_data.push(data);
                    },
                },
            },
        ];
        const queue = new Queue();
        let result = WorkerController.tick(queue);
        strictEqual(result, true); // queue is empty
        deepStrictEqual(send_data, []);
    });
    it('queue, 2 worker', () => {
        let send_data = [];
        WorkerController.worker_amount = 1;
        WorkerController.workers = [
            {
                pid: 1000,
                status: WorkerStatus.idle,
                process: {
                    send: (data) => {
                        send_data.push(data);
                    },
                },
            },
            {
                pid: 1001,
                status: WorkerStatus.busy,
                process: {
                    send: (data) => {
                        send_data.push(data);
                    },
                },
            },
        ];
        const queue = new Queue();
        queue.push({
            action: WorkerAction.status,
            data: WorkerStatus.undefined,
        });
        let result = WorkerController.tick(queue);
        strictEqual(result, false); // queue is not empty
        deepStrictEqual(send_data, [
            {
                action: {
                    key: WorkerAction.status,
                    value: WorkerStatus.undefined,
                },
            },
        ]);
    });
});
