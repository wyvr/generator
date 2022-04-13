import { deepStrictEqual, strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { WorkerController } from '../../../src/worker/controller.js';

describe('worker/controller/create', () => {
    beforeEach(() => {
        WorkerController.workers = [];
    });
    afterEach(() => {
        WorkerController.workers = [];
    });
    it('invalid worker', () => {
        const result = WorkerController.create(() => undefined);
        strictEqual(result, undefined);
    });
    it('create worker', () => {
        const result = WorkerController.create(() => {
            return { pid: 1000, on: () => {} };
        });
        deepStrictEqual(result.pid, 1000);
    });
});
