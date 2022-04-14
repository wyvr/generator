import { deepStrictEqual, strictEqual } from 'assert';
import { describe, it } from 'mocha';
import Sinon from 'sinon';
import { send } from '../../../src/worker/communication.js';

describe('worker/communication/send', () => {
    let send_data;
    before(() => {
        Sinon.stub(process, 'send');
        process.send.callsFake((data) => {
            send_data = data;
        });
    });
    beforeEach(() => {
        send_data = undefined;
    });
    it('undefined', () => {
        send_data = false;
        send();
        strictEqual(send_data, undefined);
    });
});
