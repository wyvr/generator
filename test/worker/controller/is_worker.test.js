import { deepStrictEqual, strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { WorkerController } from '../../../src/worker/controller.js';

describe('worker/controller/is_worker', () => {
    it('undefined', () => {
        strictEqual(WorkerController.is_worker(undefined), false);
    });
    it('negative pid', () => {
        strictEqual(WorkerController.is_worker(-1), false);
    });
    it('missing process', () => {
        strictEqual(WorkerController.is_worker({ pid: 1000 }), false);
    });
    it('valid worker', () => {
        strictEqual(WorkerController.is_worker({ pid: 1000, process: true }), true);
    });
});
