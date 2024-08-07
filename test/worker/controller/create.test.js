import { deepStrictEqual, strictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { WorkerAction } from '../../../src/struc/worker_action.js';
import { WorkerEmit } from '../../../src/struc/worker_emit.js';
import { WorkerStatus } from '../../../src/struc/worker_status.js';
import { WorkerController } from '../../../src/worker/controller.js';
import Sinon from 'sinon';
import { Env } from '../../../src/vars/env.js';
import { EnvType } from '../../../src/struc/env.js';
import { to_plain } from '../../../src/utils/to.js';

describe('worker/controller/create', () => {
    let logger_messages = [];
    before(() => {
        Sinon.stub(console, 'log');
        console.log.callsFake((...msg) => {
            logger_messages.push(msg.map(to_plain));
        });
    });
    beforeEach(() => {
        WorkerController.workers = [];
    });
    afterEach(() => {
        logger_messages = [];
        WorkerController.workers = [];
    });
    after(() => {
        console.log.restore();
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
    it('worker event message', () => {
        Env.set(EnvType.debug);
        const events = {};
        const worker = WorkerController.create(() => {
            return {
                pid: 1000,
                status: WorkerStatus.exists,
                on: (name, callback) => {
                    events[name] = callback;
                },
            };
        });
        deepStrictEqual(worker.pid, 1000);
        WorkerController.workers = [worker];
        const message = {
            pid: 1000,
            data: { action: { key: WorkerAction.emit, value: { type: WorkerEmit.errors, error: true } } },
        };
        events.message(message);
        Env.set(EnvType.prod);
        deepStrictEqual(logger_messages, [
            ['~', `process 1000 message ${JSON.stringify(message)}`],
            ['~', 'emit errors {"type":8,"error":true} PID 1000'],
        ]);
    });
    it('worker event error', () => {
        const events = {};
        const worker = WorkerController.create(() => {
            return {
                pid: 1000,
                status: WorkerStatus.exists,
                on: (name, callback) => {
                    events[name] = callback;
                },
            };
        });
        deepStrictEqual(worker.pid, 1000);
        WorkerController.workers = [worker];
        events.error({
            error: true,
        });
        deepStrictEqual(logger_messages, [['✖', 'process 1000 error {"error":true}']]);
    });
    it('worker event disconnect', () => {
        const events = {};
        const worker = WorkerController.create(() => {
            return {
                pid: 1000,
                status: WorkerStatus.exists,
                on: (name, callback) => {
                    events[name] = callback;
                },
            };
        });
        deepStrictEqual(worker.pid, 1000);
        WorkerController.workers = [worker];
        Env.set(EnvType.debug);
        events.disconnect();
        Env.set(EnvType.prod);
        deepStrictEqual(logger_messages, [['~', 'process 1000 disconnect']]);
    });
    it('worker event exit', () => {
        const events = {};
        const worker = WorkerController.create(() => {
            return {
                pid: 1000,
                status: WorkerStatus.exists,
                on: (name, callback) => {
                    events[name] = callback;
                },
            };
        });
        deepStrictEqual(worker.pid, 1000);
        WorkerController.workers = [worker];
        Env.set(EnvType.debug);
        events.exit(111);
        Env.set(EnvType.prod);
        deepStrictEqual(logger_messages, [
            ['~', 'process 1000 exit 111'],
            ['⚠', 'create new worker because of exit from 1000 111'],
        ]);
    });
    it('worker event close', () => {
        const events = {};
        let pid = 999;
        const worker = WorkerController.create(() => {
            pid++;
            return {
                pid,
                status: WorkerStatus.exists,
                on: (name, callback) => {
                    events[name] = callback;
                },
            };
        });
        strictEqual(worker.pid, 1000);
        WorkerController.workers = [worker];
        events.close(111);
        strictEqual(WorkerController.workers.length, 1);
        strictEqual(WorkerController.workers[0].pid, 1001);
    });
    it('worker invalid message', () => {
        Env.set(EnvType.debug);

        const events = {};
        const worker = WorkerController.create(() => {
            return {
                pid: 1000,
                status: WorkerStatus.exists,
                on: (name, callback) => {
                    events[name] = callback;
                },
            };
        });
        deepStrictEqual(worker.pid, 1000);
        WorkerController.workers = [worker];
        const message = {
            pid: 9,
            data: { action: { key: WorkerAction.emit, value: { type: WorkerEmit.errors, error: true } } },
        };
        events.message(message);
        Env.set(EnvType.prod);
        deepStrictEqual(logger_messages, [
            ['~', `process 1000 message ${JSON.stringify(message)}`],
            ['✖', 'unknown worker 9'],
        ]);
    });
});
