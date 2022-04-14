import { deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { WorkerAction } from '../../../src/struc/worker_action.js';
import { WorkerStatus } from '../../../src/struc/worker_status.js';
import { send_status } from '../../../src/worker/communication.js';

describe('worker/communication/send_status', () => {
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
        send_status();
        deepStrictEqual(send_data, {
            pid: process.pid,
            data: {
                action: {
                    key: WorkerAction.status,
                    value: WorkerStatus.exists,
                },
            },
        });
    });
    it('invalid status', () => {
        send_status(true);
        deepStrictEqual(send_data, {
            pid: process.pid,
            data: {
                action: {
                    key: WorkerAction.status,
                    value: WorkerStatus.exists,
                },
            },
        });
    });
    it('invalid status', () => {
        send_status(WorkerStatus.dead);
        deepStrictEqual(send_data, {
            pid: process.pid,
            data: {
                action: {
                    key: WorkerAction.status,
                    value: WorkerStatus.dead,
                },
            },
        });
    });
});
