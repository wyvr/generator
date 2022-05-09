import { strictEqual, deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { dirname, join, resolve } from 'path';
import Sinon from 'sinon';
import { fileURLToPath } from 'url';
import { wait_until_idle } from '../../src/action/wait_until_idle.js';
import { WorkerStatus } from '../../src/struc/worker_status.js';
import { WorkerController } from '../../src/worker/controller.js';

describe('action/wait_until_idle', () => {
    const __dirname = dirname(resolve(join(fileURLToPath(import.meta.url))));
    const __root = join(__dirname, '..', '..');
    const __path = join('test', 'action', '_tests', 'present');
    const test_folder = join(__root, __path);
    let sandbox;
    let exit_code = 0;

    before(() => {
        WorkerController.workers = [];
        WorkerController.worker_amount = undefined;
        sandbox = Sinon.createSandbox();
        sandbox.stub(process, 'exit');
        process.exit.callsFake((code) => {
            exit_code = code;
        });
    });
    beforeEach(() => {
        exit_code = 0;
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
        strictEqual(exit_code, 1);
        deepStrictEqual(error, undefined);
    });
});
