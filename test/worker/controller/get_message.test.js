import { deepStrictEqual, strictEqual } from 'assert';
import { describe, it } from 'mocha';
import Sinon from 'sinon';
import { LogType } from '../../../src/struc/log.js';
import { WorkerAction } from '../../../src/struc/worker_action.js';
import { WorkerEmit } from '../../../src/struc/worker_emit.js';
import { WorkerController } from '../../../src/worker/controller.js';
import { Event } from '../../../src/utils/event.js';
import { WorkerStatus } from '../../../src/struc/worker_status.js';
import { Env } from '../../../src/vars/env.js';
import { EnvType } from '../../../src/struc/env.js';

describe('worker/controller/get_message', () => {
    let logger_messages = [];
    before(() => {
        Sinon.stub(console, 'error');
        console.error.callsFake((...msg) => {
            logger_messages.push(msg);
        });
    });
    afterEach(() => {
        logger_messages = [];
        WorkerController.workers = [];
    });
    after(() => {
        console.error.restore();
    });
    it('undefined', () => {
        const result = WorkerController.get_message(undefined);
        deepStrictEqual(result, false);
        deepStrictEqual(logger_messages, []);
    });
    it('empty', () => {
        const result = WorkerController.get_message({});
        deepStrictEqual(result, false);
        deepStrictEqual(logger_messages, []);
    });
    it('unknown worker', () => {
        const result = WorkerController.get_message({
            pid: 1000,
            data: { action: { key: 'unknown', value: 'unknown' } },
        });
        deepStrictEqual(result, false);
        deepStrictEqual(logger_messages, [['\x1B[31m✖\x1B[39m', '\x1B[31munknown worker 1000\x1B[39m']]);
    });
    it('unknown status', () => {
        WorkerController.workers = [{ pid: 1000 }];
        const result = WorkerController.get_message({
            pid: 1000,
            data: { action: { key: WorkerAction.status, value: -1 } },
        });
        strictEqual(result, false);
        deepStrictEqual(logger_messages, [
            ['\x1B[31m✖\x1B[39m', '\x1B[31munknown state -1 \x1B[2mPID 1000\x1B[22m\x1B[39m'],
        ]);
    });
    it('update status', () => {
        Env.set(EnvType.debug);
        WorkerController.workers = [{ pid: 1000, status: WorkerStatus.exists }];
        const result = WorkerController.get_message({
            pid: 1000,
            data: { action: { key: WorkerAction.status, value: WorkerStatus.dead } },
        });
        Env.set(EnvType.prod);

        deepStrictEqual(result, { pid: 1000, status: WorkerStatus.dead });
        deepStrictEqual(logger_messages, [
            ['\u001b[2m~\u001b[22m', '\u001b[2mstatus dead \u001b[2mPID 1000\u001b[22m\u001b[2m\u001b[22m'],
            ['\u001b[2m~\u001b[22m', '\u001b[2m[5]\u001b[22m'],
        ]);
    });
    it('broken log', () => {
        WorkerController.workers = [{ pid: 1000 }];
        const result = WorkerController.get_message({
            pid: 1000,
            data: { action: { key: WorkerAction.log, value: {} } },
        });
        deepStrictEqual(result, false);
        deepStrictEqual(logger_messages, []);
    });
    it('log message', () => {
        WorkerController.workers = [{ pid: 1000 }];
        const result = WorkerController.get_message({
            pid: 1000,
            data: { action: { key: WorkerAction.log, value: { type: LogType.log, messages: 'test' } } },
        });
        deepStrictEqual(result, false);
        deepStrictEqual(logger_messages, []);
    });
    it('log messages', () => {
        WorkerController.workers = [{ pid: 1000 }];
        const result = WorkerController.get_message({
            pid: 1000,
            data: { action: { key: WorkerAction.log, value: { type: LogType.log, messages: ['test'] } } },
        });
        deepStrictEqual(result, {
            pid: 1000,
        });
        deepStrictEqual(logger_messages, [['test', '\u001b[2mPID 1000\u001b[22m']]);
    });
    it('unknown emit', () => {
        WorkerController.workers = [{ pid: 1000 }];
        const result = WorkerController.get_message({
            pid: 1000,
            data: { action: { key: WorkerAction.emit, value: { type: 0 } } },
        });
        strictEqual(result, false);
        deepStrictEqual(logger_messages, [
            ['\x1B[31m✖\x1B[39m', '\x1B[31munknown emit {"type":0} \x1B[2mPID 1000\x1B[22m\x1B[39m'],
        ]);
    });
    it('emit error', () => {
        WorkerController.workers = [{ pid: 1000 }];
        let emitted;
        Event.listeners = {};
        Event.on('emit', 'errors', (data) => {
            emitted = data;
        });
        const result = WorkerController.get_message({
            pid: 1000,
            data: { action: { key: WorkerAction.emit, value: { type: WorkerEmit.errors, error: true } } },
        });
        Event.listeners = {};
        deepStrictEqual(result, {
            pid: 1000,
        });
        deepStrictEqual(logger_messages, []);
        deepStrictEqual(emitted, { type: WorkerEmit.errors, error: true });
    });
});
