import { deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { WorkerAction } from '../../../src/struc/worker_action.js';
import { WorkerStatus } from '../../../src/struc/worker_status.js';
import { send_complete } from '../../../src/worker/communication.js';

describe('worker/communication/send_complete', () => {
    let mock_send;
    let send_data = [];
    before(() => {
        mock_send = process.send;

        process.send = (data) => {
            send_data.push(data);
        };
    });
    afterEach(() => {
        send_data = [];
    });
    after(() => {
        process.send = mock_send;
    });
    it('undefined', () => {
        send_complete();
        deepStrictEqual(send_data, [
            {
                pid: process.pid,
                data: {
                    action: {
                        key: WorkerAction.status,
                        value: WorkerStatus.done,
                    },
                },
            },
            {
                pid: process.pid,
                data: {
                    action: {
                        key: WorkerAction.status,
                        value: WorkerStatus.idle,
                    },
                },
            },
        ]);
    });
});
