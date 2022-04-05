import { deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { Config } from '../../../src/utils/config.js';

describe('utils/config/merge', () => {
    it('undefined', () => {
        deepStrictEqual(Config.merge(), undefined);
    });
    it('undefined params', () => {
        deepStrictEqual(Config.merge(undefined, undefined), undefined);
    });
    it('value', () => {
        deepStrictEqual(Config.merge({}, { key: 'value' }), {
            key: 'value',
        });
    });
    it('first undefined', () => {
        deepStrictEqual(Config.merge(undefined, { key: 'value' }), {
            key: 'value',
        });
    });
    it('second undefined', () => {
        deepStrictEqual(Config.merge({ key: 'value' }, undefined), {
            key: 'value',
        });
    });
});
