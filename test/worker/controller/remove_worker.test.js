import { deepStrictEqual, strictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { WorkerController } from '../../../src/worker/controller.js';

describe('worker/controller/remove_worker', () => {
    beforeEach(() => {
        WorkerController.workers = [];
    });
    afterEach(() => {
        WorkerController.workers = [];
    });
    it('undefined', () => {
        WorkerController.remove_worker(undefined);
        WorkerController.workers.push({ pid: 1000 });
        deepStrictEqual(WorkerController.workers, [{ pid: 1000 }]);
    });
    it('negative pid', () => {
        WorkerController.remove_worker(-1);
        WorkerController.workers.push({ pid: 1000 });
        deepStrictEqual(WorkerController.workers, [{ pid: 1000 }]);
    });
    it('containing worker', () => {
        WorkerController.workers.push({ pid: 1000 });
        WorkerController.remove_worker(1000);
        deepStrictEqual(WorkerController.workers, []);
    });
});
