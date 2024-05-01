import { deepStrictEqual, strictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { WorkerController } from '../../../src/worker/controller.js';
import Sinon from 'sinon';

describe('worker/controller/set_worker_ratio', () => {
    let logger_messages = [];
    before(() => {
        Sinon.stub(console, 'error');
        console.error.callsFake((...msg) => {
            logger_messages.push(msg);
        });
    });
    beforeEach(() => {
        WorkerController.worker_ratio = 0;
    });
    afterEach(() => {
        logger_messages = [];
        WorkerController.worker_ratio = 0;
    });
    after(() => {
        console.error.restore();
    });
    it('undefined', () => {
        WorkerController.set_worker_ratio(undefined);
        strictEqual(WorkerController.worker_ratio, 0);
        deepStrictEqual(logger_messages, [['\x1B[33m⚠\x1B[39m', '\x1B[33minvalid worker ratio undefined\x1B[39m']]);
    });
    it('-1', () => {
        WorkerController.set_worker_ratio(-1);
        strictEqual(WorkerController.worker_ratio, 0);
        deepStrictEqual(logger_messages, [['\x1B[33m⚠\x1B[39m', '\x1B[33minvalid worker ratio -1\x1B[39m']]);
    });
    it('2', () => {
        WorkerController.set_worker_ratio(2);
        strictEqual(WorkerController.worker_ratio, 0);
        deepStrictEqual(logger_messages, [['\x1B[33m⚠\x1B[39m', '\x1B[33minvalid worker ratio 2\x1B[39m']]);
    });
    it('0.5', () => {
        WorkerController.set_worker_ratio(0.5);
        strictEqual(WorkerController.worker_ratio, 0.5);
        deepStrictEqual(logger_messages, []);
    });
    it('1', () => {
        WorkerController.set_worker_ratio(1);
        strictEqual(WorkerController.worker_ratio, 1);
        deepStrictEqual(logger_messages, []);
    });
});
