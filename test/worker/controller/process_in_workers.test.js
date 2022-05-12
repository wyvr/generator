import { deepStrictEqual, strictEqual } from 'assert';
import { describe, it } from 'mocha';
import Sinon from 'sinon';
import { Queue } from '../../../src/model/queue.js';
import { WorkerAction } from '../../../src/struc/worker_action.js';
import { WorkerStatus } from '../../../src/struc/worker_status.js';
import { WorkerController } from '../../../src/worker/controller.js';

describe('worker/controller/process_in_workers', () => {
    let logger_messages = [];
    let exit_code;
    let sandbox;
    let send_data = [];

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
    });
    afterEach(() => {
        logger_messages = [];
        send_data = [];
        exit_code = 0;
    });
    after(() => {
        WorkerController.worker_amount = undefined;
        WorkerController.workers = [];
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
});
