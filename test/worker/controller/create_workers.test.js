import { deepStrictEqual, strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { WorkerController } from '../../../src/worker/controller.js';

describe('worker/controller/create_workers', () => {
    beforeEach(() => {
        WorkerController.workers = [];
    });
    afterEach(() => {
        WorkerController.workers = [];
    });
    it('invalid worker', () => {
        WorkerController.create_workers(1, () => undefined);
        strictEqual(WorkerController.workers.length, 0);
    });
    it('create worker', () => {
        WorkerController.create_workers(1, () => {
            return { pid: 1000, on: () => {} };
        });
        strictEqual(WorkerController.workers.length, 1);
    });
});
