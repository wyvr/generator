import { deepStrictEqual, strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { WorkerAction } from '../../../src/struc/worker_action.js';
import { WorkerEmit } from '../../../src/struc/worker_emit.js';
import { WorkerStatus } from '../../../src/struc/worker_status.js';
import { WorkerController } from '../../../src/worker/controller.js';
import Sinon from 'sinon';
import { Env } from '../../../src/vars/env.js';
import { EnvType } from '../../../src/struc/env.js';

describe('worker/controller/create', () => {
    let logger_messages = [];
    before(() => {
        Sinon.stub(console, 'error');
        console.error.callsFake((...msg) => {
            logger_messages.push(msg);
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
        console.error.restore();
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
        deepStrictEqual(logger_messages, [
            ['\x1B[34mℹ\x1B[39m', 'process \x1B[34m1000\x1B[39m message ' + JSON.stringify(message)],
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
        deepStrictEqual(logger_messages, [['\x1B[31m✖\x1B[39m', '\x1B[31mprocess 1000 error {"error":true}\x1B[39m']]);
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
        deepStrictEqual(logger_messages, [['\x1B[2m~\x1B[22m', '\x1B[2mprocess 1000 disconnect\x1B[22m']]);
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
        deepStrictEqual(logger_messages, [['\x1B[2m~\x1B[22m', '\x1B[2mprocess 1000 exit 111\x1B[22m']]);
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
        deepStrictEqual(logger_messages, [
            ['\u001b[34mℹ\u001b[39m', 'process \u001b[34m1000\u001b[39m message ' + JSON.stringify(message)],
            ['\x1B[31m✖\x1B[39m', '\x1B[31munknown worker 9\x1B[39m'],
        ]);
    });
});
