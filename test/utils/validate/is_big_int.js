import { strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { is_big_int } from '../../../src/utils/validate.js';

describe('utils/validate/is_big_int', () => {
    it('undefined', () => {
        strictEqual(is_big_int(), false);
    });
    it('null', () => {
        strictEqual(is_big_int(null), false);
    });
    it('empty string', () => {
        strictEqual(is_big_int(''), false);
    });
    it('string', () => {
        strictEqual(is_big_int('huhu'), false);
    });
    it('int', () => {
        strictEqual(is_big_int(1), false);
    });
    it('float', () => {
        strictEqual(is_big_int(1.1), false);
    });
    it('bigint', () => {
        strictEqual(is_big_int(BigInt(Number.MAX_SAFE_INTEGER)), true);
    });
    it('empty array', () => {
        strictEqual(is_big_int([]), false);
    });
    it('array', () => {
        strictEqual(is_big_int(['a']), false);
    });
    it('empty object', () => {
        strictEqual(is_big_int({}), false);
    });
    it('object', () => {
        strictEqual(is_big_int({ a: true }), false);
    });
    it('boolean true', () => {
        strictEqual(is_big_int(true), false);
    });
    it('boolean false', () => {
        strictEqual(is_big_int(false), false);
    });
    it('symbol', () => {
        strictEqual(is_big_int(Symbol('foo')), false);
    });
    it('date', () => {
        strictEqual(is_big_int(new Date()), false);
    });
    it('regex', () => {
        strictEqual(is_big_int(/.*/), false);
    });
});
