import { deepStrictEqual, strictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { WorkerAction } from '../../../src/struc/worker_action.js';
import { WorkerStatus } from '../../../src/struc/worker_status.js';
import { Cwd } from '../../../src/vars/cwd.js';
import { WorkerController } from '../../../src/worker/controller.js';

describe('worker/controller/livecycle', () => {
    let messages;
    before(() => {
        Cwd.set(process.cwd());
    });
    after(() => {
        Cwd.set(undefined);
    });
    afterEach(() => {
        messages = undefined;
    });
    it('undefined', () => {
        strictEqual(WorkerController.livecycle(undefined), false);
    });
    it('negative pid', () => {
        strictEqual(WorkerController.livecycle(-1), false);
    });
    it('worker without status', () => {
        const result = WorkerController.livecycle({ pid: 1000 });
        strictEqual(result, false);
    });
    it('unknown status', () => {
        const result = WorkerController.livecycle({ pid: 1000, status: 1000 });
        strictEqual(result, false);
    });
    it('dead worker', () => {
        const result = WorkerController.livecycle({ pid: 1000, status: WorkerStatus.dead });
        strictEqual(result, false);
    });
    it('existing worker, without process', () => {
        const result = WorkerController.livecycle({ pid: 1000, status: WorkerStatus.exists });
        strictEqual(result, false);
    });
    it('existing worker, with process', () => {
        const result = WorkerController.livecycle({
            pid: 1000,
            status: WorkerStatus.exists,
            process: {
                send: (data) => {
                    messages = data;
                },
            },
        });
        strictEqual(result, true);
        strictEqual(messages.action.key, WorkerAction.configure);
        strictEqual(messages.action.value != null, true);
    });
});
