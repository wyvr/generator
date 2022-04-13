import { deepStrictEqual, strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { WorkerStatus } from '../../../src/struc/worker_status.js';
import { WorkerController } from '../../../src/worker/controller.js';

describe('worker/controller/send_message', () => {
    let messages;
    const error = console.error;
    console.error = (...args) => {
        console_messages = args;
    };
    let console_messages;
    afterEach(() => {
        messages = undefined;
        console_messages = undefined;
    });
    after(() => {
        console.error = error;
    });
    it('undefined', () => {
        strictEqual(WorkerController.send_message(undefined), false);
    });
    it('negative pid', () => {
        strictEqual(WorkerController.send_message(-1), false);
    });
    it('worker without status', () => {
        strictEqual(WorkerController.send_message({ pid: 1000 }), false);
    });
    it('dead worker', () => {
        const result = WorkerController.send_message({ pid: 1000, status: WorkerStatus.dead });
        strictEqual(result, false);
    });
    it('existing worker, without process', () => {
        const result = WorkerController.send_message({ pid: 1000, status: WorkerStatus.exists });
        strictEqual(result, false);
    });
    it('existing worker, without data', () => {
        const result = WorkerController.send_message({
            pid: 1000,
            status: WorkerStatus.exists,
            process: {
                send: (data) => {
                    messages = data;
                },
            },
        });
        strictEqual(result, false);
        deepStrictEqual(console_messages, [
            '\x1B[33m⚠\x1B[39m',
            '\x1B[33mcan not send empty message to worker 1000\x1B[39m',
        ]);
    });
    it('worker successfully sent', () => {
        const result = WorkerController.send_message(
            {
                pid: 1000,
                status: WorkerStatus.exists,
                process: {
                    send: (data) => {
                        messages = data;
                    },
                },
            },
            { value: true }
        );
        strictEqual(result, true);
        deepStrictEqual(messages, {
            value: true,
        });
        deepStrictEqual(console_messages, undefined);
    });
});
