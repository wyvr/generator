import { deepStrictEqual, strictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { WorkerStatus } from '../../../src/struc/worker_status.js';
import { to_plain } from '../../../src/utils/to.js';
import { WorkerController } from '../../../src/worker/controller.js';
import Sinon from 'sinon';

describe('worker/controller/set_all_workers', () => {
    let messages;
    let logger_messages = [];
    before(() => {
        Sinon.stub(console, 'log');
        console.log.callsFake((...msg) => {
            logger_messages.push(msg.map(to_plain));
        });
    });
    beforeEach(() => {
        logger_messages = [];
        WorkerController.workers = [
            {
                pid: 1000,
                status: WorkerStatus.exists,
                process: {
                    send: (data) => {
                        messages = data;
                    },
                },
            },
        ];
    });
    afterEach(() => {
        messages = undefined;
        logger_messages = [];
        WorkerController.workers = [];
    });
    after(() => {
        console.log.restore();
    });
    it('undefined', () => {
        strictEqual(WorkerController.set_all_workers(), false);
        deepStrictEqual(messages, undefined);
    });
    it('only key', () => {
        strictEqual(WorkerController.set_all_workers('test'), true);
        deepStrictEqual(messages.action.value.key, 'test');
        deepStrictEqual(messages.action.value.value, undefined);
    });
    it('key & value', () => {
        strictEqual(WorkerController.set_all_workers('test', 'huhu'), true);
        deepStrictEqual(messages.action.value.key, 'test');
        deepStrictEqual(messages.action.value.value, 'huhu');
    });
});
