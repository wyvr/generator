import { strictEqual, deepStrictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { join } from 'node:path';
import Sinon from 'sinon';
import { wait_until_idle } from '../../src/action/wait_until_idle.js';
import { WorkerStatus } from '../../src/struc/worker_status.js';
import { to_dirname, to_plain } from '../../src/utils/to.js';
import { WorkerController } from '../../src/worker/controller.js';

describe('action/wait_until_idle', () => {
    const __dirname = to_dirname(import.meta.url);
    const __root = join(__dirname, '..', '..');
    const __path = join('test', 'action', '_tests', 'present');
    const test_folder = join(__root, __path);
    let sandbox;
    let exit_code = 0;
    let log = [];

    before(() => {
        WorkerController.workers = [];
        WorkerController.worker_amount = undefined;
        sandbox = Sinon.createSandbox();
        sandbox.stub(process, 'exit');
        process.exit.callsFake((code) => {
            exit_code = code;
        });
        sandbox.stub(console, 'log');
        console.log.callsFake((...args) => {
            log.push(args.map(to_plain));
        });
    });
    beforeEach(() => {
        exit_code = 0;
    });
    afterEach(() => {
        log = [];
    });
    after(() => {
        WorkerController.workers = [];
        WorkerController.worker_amount = undefined;
        sandbox.restore();
    });
    it('instant done', async () => {
        WorkerController.workers = [{ pid: 1000, status: WorkerStatus.idle }];
        WorkerController.worker_amount = 1;
        let error;
        try {
            await wait_until_idle();
        } catch (e) {
            error = e;
        }
        strictEqual(exit_code, 0);
        deepStrictEqual(error, undefined);
    });
    it('wait some time to done', async () => {
        WorkerController.workers = [{ pid: 1000, status: WorkerStatus.busy }];
        WorkerController.worker_amount = 1;
        let error;
        setTimeout(() => {
            WorkerController.workers[0].status = WorkerStatus.idle;
        }, 200);
        try {
            await wait_until_idle();
        } catch (e) {
            error = e;
        }
        strictEqual(exit_code, 0);
        deepStrictEqual(error, undefined);
    });
    it('emergency stop', async () => {
        WorkerController.workers = [{ pid: 1000, status: WorkerStatus.busy }];
        WorkerController.worker_amount = 1;
        let error;
        try {
            await wait_until_idle(0.05);
        } catch (e) {
            error = e;
        }
        strictEqual(exit_code, 1, 'exit code');
        deepStrictEqual(error, undefined);
        deepStrictEqual(
            log[0][1].indexOf('emergency stop, waited'),
            0,
            'log contains emergency message'
        );
    });
});
