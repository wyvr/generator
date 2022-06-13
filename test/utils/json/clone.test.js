import { deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import Sinon from 'sinon';
import { clone } from '../../../src/utils/json.js';
import { Logger } from '../../../src/utils/logger.js';
import { to_plain } from '../../../src/utils/to.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/clone/clone', () => {
    let log = [];
    before(() => {
        Cwd.set(process.cwd());
        Sinon.stub(Logger, 'output');
        Logger.output.callsFake((...msg) => {
            log.push(msg.map(to_plain));
        });
    });
    afterEach(() => {
        log = [];
    });
    after(() => {
        Cwd.set(undefined);
        Logger.output.restore();
    });
    it('undefined', () => {
        const value = clone();
        deepStrictEqual(value, undefined);
    });
    it('clone object', () => {
        const value = clone({ key: 'value' });
        deepStrictEqual(value, { key: 'value' });
    });
    it('error cloning', () => {
        const value = clone({ key: 'value' });
        deepStrictEqual(value, { key: 'value' });
    });
    it('circular reference', () => {
        const obj1 = {
            key: '1',
            ref: undefined,
        };
        const obj2 = {
            key: '2',
            ref: obj1,
        };
        obj1.ref = obj2;
        const value = clone(obj1);
        deepStrictEqual(log, []);
        deepStrictEqual(value, { key: '1', ref: { key: '2' } });
    });
});
