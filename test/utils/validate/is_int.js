import { strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { is_int } from '../../../src/utils/validate.js';

describe('utils/validate/is_int', () => {
    it('undefined', () => {
        strictEqual(is_int(), false);
    });
    it('null', () => {
        strictEqual(is_int(null), false);
    });
    it('empty string', () => {
        strictEqual(is_int(''), false);
    });
    it('string', () => {
        strictEqual(is_int('huhu'), false);
    });
    it('int', () => {
        strictEqual(is_int(1), true);
    });
    it('float', () => {
        strictEqual(is_int(1.1), true);
    });
    it('bigint', () => {
        strictEqual(is_int(BigInt(Number.MAX_SAFE_INTEGER)), false);
    });
    it('empty array', () => {
        strictEqual(is_int([]), false);
    });
    it('array', () => {
        strictEqual(is_int(['a']), false);
    });
    it('empty object', () => {
        strictEqual(is_int({}), false);
    });
    it('object', () => {
        strictEqual(is_int({ a: true }), false);
    });
    it('boolean true', () => {
        strictEqual(is_int(true), false);
    });
    it('boolean false', () => {
        strictEqual(is_int(false), false);
    });
    it('symbol', () => {
        strictEqual(is_int(Symbol('foo')), false);
    });
    it('date', () => {
        strictEqual(is_int(new Date()), false);
    });
    it('regex', () => {
        strictEqual(is_int(/.*/), false);
    });
});
