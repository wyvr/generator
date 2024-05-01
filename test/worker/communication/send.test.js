import { deepStrictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { send } from '../../../src/worker/communication.js';
import { Event } from '../../../src/utils/event.js';

describe('worker/communication/send', () => {
    let orig_send;
    let send_data;
    before(() => {
        orig_send = process.send;

        process.send = (data) => {
            send_data = data;
        };
    });
    afterEach(() => {
        send_data = undefined;
    });
    after(() => {
        process.send = orig_send;
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
    it('no process send available, use events', () => {
        let result;
        const id = Event.on('master', 'message', (data) => (result = data));
        process.send = undefined;
        send(true);
        Event.off('master', 'message', id);
        deepStrictEqual(result, {
            pid: process.pid,
            data: true,
        });
        deepStrictEqual(send_data, undefined);
    });
});
