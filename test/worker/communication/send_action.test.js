import { deepStrictEqual, strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { EnvType } from '../../../src/struc/env.js';
import { WorkerAction } from '../../../src/struc/worker_action.js';
import { WorkerStatus } from '../../../src/struc/worker_status.js';
import { Env } from '../../../src/vars/env.js';
import { send_action } from '../../../src/worker/communication.js';

describe('worker/communication/send_action', () => {
    let mock_send;
    let send_data;
    before(() => {
        mock_send = process.send;

        process.send = (data) => {
            send_data = data;
        };
    });
    afterEach(() => {
        send_data = undefined;
    });
    after(() => {
        process.send = mock_send;
    });
    it('undefined', () => {
        send_data = false;
        strictEqual(send_action(), false);
        deepStrictEqual(send_data, false);
    });
    it('only action', () => {
        send_action(WorkerAction.log);
        deepStrictEqual(send_data, {
            pid: process.pid,
            data: {
                action: {
                    key: 0,
                    value: undefined,
                },
            },
        });
    });
    it('complete', () => {
        send_action(WorkerAction.log, true);
        deepStrictEqual(send_data, {
            pid: process.pid,
            data: {
                action: {
                    key: 0,
                    value: true,
                },
            },
        });
    });
    it('complete in debug', () => {
        Env.set(EnvType.debug);
        send_action(WorkerAction.log, true);
        Env.set(EnvType.prod);
        deepStrictEqual(send_data, {
            pid: process.pid,
            data: {
                action: {
                    key: 0,
                    key_name: 'log',
                    value: true,
                },
            },
        });
    });
    it('send status', () => {
        send_action(WorkerAction.status, WorkerStatus.dead);
        deepStrictEqual(send_data, {
            pid: process.pid,
            data: {
                action: {
                    key: 1,
                    value: 5,
                },
            },
        });
    });
    it('send status in debug', () => {
        Env.set(EnvType.debug);
        send_action(WorkerAction.status, WorkerStatus.dead);
        Env.set(EnvType.prod);
        deepStrictEqual(send_data, {
            pid: process.pid,
            data: {
                action: {
                    key: 1,
                    key_name: 'status',
                    value: 5,
                    value_name: 'dead',
                },
            },
        });
    });
});
