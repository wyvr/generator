import { deepStrictEqual, strictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { WorkerController } from '../../../src/worker/controller.js';

describe('worker/controller/get_worker', () => {
    beforeEach(() => {
        WorkerController.workers = [];
    });
    afterEach(() => {
        WorkerController.workers = [];
    });
    it('undefined', () => {
        deepStrictEqual(WorkerController.get_worker(undefined), undefined);
    });
    it('negative pid', () => {
        deepStrictEqual(WorkerController.get_worker(-1), undefined);
    });
    it('containing worker', () => {
        WorkerController.workers.push({ pid: 1000 });

        deepStrictEqual(WorkerController.get_worker(1000), { pid: 1000 });
    });
});
