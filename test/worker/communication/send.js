import { deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { send } from '../../../src/worker/communication.js';

describe('worker/communication/send', () => {
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
        send();
        deepStrictEqual(send_data, {
            pid: process.pid,
            data: undefined,
        });
    });
    it('with data', () => {
        send(true);
        deepStrictEqual(send_data, {
            pid: process.pid,
            data: true,
        });
    });
});
