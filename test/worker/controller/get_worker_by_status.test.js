import { deepStrictEqual, strictEqual } from 'assert';
import { describe, it } from 'mocha';
import Sinon from 'sinon';
import { LogType } from '../../../src/struc/log.js';
import { WorkerAction } from '../../../src/struc/worker_action.js';
import { WorkerEmit } from '../../../src/struc/worker_emit.js';
import { WorkerController } from '../../../src/worker/controller.js';
import { Event } from '../../../src/utils/event.js';
import { WorkerStatus } from '../../../src/struc/worker_status.js';

describe('worker/controller/get_workers_by_status', () => {
    let logger_messages = [];
    before(() => {
        Sinon.stub(console, 'error');
        console.error.callsFake((...msg) => {
            logger_messages.push(msg);
        });
        WorkerController.workers = [
            { pid: 1000, status: WorkerStatus.exists },
            { pid: 2000, status: WorkerStatus.idle },
            { pid: 1100, status: WorkerStatus.exists },
            { pid: 1200, status: WorkerStatus.exists },
            { pid: 2100, status: WorkerStatus.idle },
            { pid: 3000, status: WorkerStatus.busy },
        ];
    });
    afterEach(() => {
        logger_messages = [];
    });
    after(() => {
        WorkerController.workers = [];
        console.error.restore();
    });
    it('undefined', () => {
        const result = WorkerController.get_workers_by_status(undefined);
        deepStrictEqual(result, []);
        deepStrictEqual(logger_messages, []);
    });
    it('empty', () => {
        const result = WorkerController.get_workers_by_status(WorkerStatus.dead);
        deepStrictEqual(result, []);
        deepStrictEqual(logger_messages, []);
    });
    it('busy', () => {
        const result = WorkerController.get_workers_by_status(WorkerStatus.busy);
        deepStrictEqual(result, [{ pid: 3000, status: WorkerStatus.busy }]);
        deepStrictEqual(logger_messages, []);
    });
});
