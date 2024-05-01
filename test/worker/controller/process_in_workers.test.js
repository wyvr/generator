import { deepStrictEqual, strictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import Sinon from 'sinon';
import { Queue } from '../../../src/model/queue.js';
import { WorkerAction } from '../../../src/struc/worker_action.js';
import { WorkerStatus } from '../../../src/struc/worker_status.js';
import { Event } from '../../../src/utils/event.js';
import { WorkerController } from '../../../src/worker/controller.js';
import { WorkerMock } from '../worker_mock.js';

describe('worker/controller/process_in_workers', () => {
    let logger_messages = [];
    let exit_code;
    let sandbox;

    before(() => {
        sandbox = Sinon.createSandbox();
        sandbox.stub(process, 'exit');
        process.exit.callsFake((code) => {
            exit_code = code;
        });
        sandbox.stub(console, 'error');
        console.error.callsFake((...msg) => {
            logger_messages.push(msg);
        });
    });
    beforeEach(() => {
        WorkerMock.workers(1);
    });
    afterEach(() => {
        logger_messages = [];
        exit_code = 0;
        WorkerMock.reset();
    });
    after(() => {
        WorkerMock.reset();
        sandbox.restore();
    });
    it('undefined without worker', async () => {
        WorkerController.worker_amount = 1;
        WorkerController.workers = [];
        const result = await WorkerController.process_in_workers();
        strictEqual(exit_code, 1);
    });
    it('undefined', async () => {
        const result = await WorkerController.process_in_workers();
        strictEqual(exit_code, 0);
        deepStrictEqual(logger_messages, [['\x1B[31m✖\x1B[39m', '\x1B[31munknown action\x1B[39m']]);
    });
    it('undefined action', async () => {
        const result = await WorkerController.process_in_workers(undefined, []);
        strictEqual(result, false);
        strictEqual(exit_code, 0);
        deepStrictEqual(logger_messages, [['\x1B[31m✖\x1B[39m', '\x1B[31munknown action\x1B[39m']]);
    });
    it('undefined action with list', async () => {
        const result = await WorkerController.process_in_workers(undefined, [true]);
        strictEqual(result, false);
        strictEqual(exit_code, 0);
        deepStrictEqual(logger_messages, [['\x1B[31m✖\x1B[39m', '\x1B[31munknown action\x1B[39m']]);
    });
    it('correct batch size', async () => {
        WorkerMock.workers(2);
        const list = new Array(10).fill(true);
        const result = await WorkerController.process_in_workers(WorkerAction.log, list, 1000);
        strictEqual(result, true);
        strictEqual(exit_code, 0);
        deepStrictEqual(WorkerMock.data, [
            {
                action: {
                    key: 0,
                    value: [true, true, true, true, true],
                },
            },
            {
                action: {
                    key: 0,
                    value: [true, true, true, true, true],
                },
            },
        ]);
        deepStrictEqual(logger_messages, [
            ['\x1B[34mℹ\x1B[39m', 'process \u001b[34m10\u001b[39m items \u001b[2mbatch size 1000\u001b[22m'],
        ]);
    });
    it('single item list', async () => {
        WorkerMock.workers(2);
        const list = [true];
        const result = await WorkerController.process_in_workers(WorkerAction.log, list, 1000);

        strictEqual(result, true);
        strictEqual(exit_code, 0);
        deepStrictEqual(WorkerMock.data, [
            {
                action: {
                    key: 0,
                    value: [true],
                },
            },
        ]);
        deepStrictEqual(logger_messages, [
            ['\x1B[34mℹ\x1B[39m', 'process \u001b[34m1\u001b[39m item \u001b[2mbatch size 1000\u001b[22m'],
        ]);
    });
    it('empty list', async () => {
        WorkerMock.workers(2);
        const list = [];
        const result = await WorkerController.process_in_workers(WorkerAction.log, list, 1000);
        strictEqual(result, true);
        strictEqual(exit_code, 0);
        deepStrictEqual(WorkerMock.data, []);
        deepStrictEqual(logger_messages, [
            ['\x1B[35m…\x1B[39m', '\x1B[35mno items to process, batch size \x1B[36m1000\x1B[39m\x1B[35m\x1B[39m'],
        ]);
    });
    it('empty batch size', async () => {
        WorkerMock.workers(2);
        const list = new Array(10).fill(true);
        const result = await WorkerController.process_in_workers(WorkerAction.log, list);
        strictEqual(result, true);
        strictEqual(exit_code, 0);
        deepStrictEqual(WorkerMock.data, [
            {
                action: {
                    key: 0,
                    value: [true, true, true, true, true],
                },
            },
            {
                action: {
                    key: 0,
                    value: [true, true, true, true, true],
                },
            },
        ]);
        deepStrictEqual(logger_messages, [
            ['\x1B[34mℹ\x1B[39m', 'process \u001b[34m10\u001b[39m items \u001b[2mbatch size 10\u001b[22m'],
        ]);
    });
});
