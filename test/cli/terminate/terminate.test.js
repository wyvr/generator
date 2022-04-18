import { strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { terminate } from '../../../src/cli/terminate.js';
import Sinon from 'sinon';

describe('cli/terminate/terminate', () => {
    let exit_value;
    before(() => {
        Sinon.stub(process, 'exit');
        process.exit.callsFake((code) => {
            exit_value = code;
        });
    });
    afterEach(() => {
        exit_value = undefined;
    });
    after(() => {
        process.exit.restore();
    });
    it('missing value', () => {
        terminate();
        strictEqual(exit_value, undefined);
    });
    it('terminate', () => {
        terminate(true);
        strictEqual(exit_value, 1);
    });
    it('bool proceed', () => {
        terminate(false);
        strictEqual(exit_value, undefined);
    });
    it('string proceed', () => {
        terminate('');
        strictEqual(exit_value, undefined);
    });
});
