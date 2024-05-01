import { deepStrictEqual, strictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { cpus } from 'os';
import { WorkerController } from '../../../src/worker/controller.js';

describe('worker/controller/get_worker_amount', () => {
    beforeEach(() => {
        WorkerController.workers = [];
        WorkerController.worker_ratio = 0;
        WorkerController.worker_amount = undefined;
        WorkerController.max_cores = undefined;
    });
    afterEach(() => {});
    it('from cache', () => {
        WorkerController.worker_amount = 10;
        strictEqual(WorkerController.get_worker_amount(), 10);
    });
    it('max cores', () => {
        WorkerController.max_cores = 20;
        strictEqual(WorkerController.get_worker_amount(), 20);
    });
    it('calculate cores', () => {
        WorkerController.worker_ratio = 1;
        strictEqual(WorkerController.get_worker_amount(), cpus().length - 1);
    });
    it('negative ratio', () => {
        WorkerController.worker_ratio = -1;
        strictEqual(WorkerController.get_worker_amount(), 1);
    });
});
