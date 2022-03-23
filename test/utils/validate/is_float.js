import { strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { is_float } from '../../../src/utils/validate.js';

describe('utils/validate/is_float', () => {
    it('undefined', () => {
        strictEqual(is_float(), false);
    });
    it('null', () => {
        strictEqual(is_float(null), false);
    });
    it('empty string', () => {
        strictEqual(is_float(''), false);
    });
    it('string', () => {
        strictEqual(is_float('huhu'), false);
    });
    it('int', () => {
        strictEqual(is_float(1), false);
    });
    it('float', () => {
        strictEqual(is_float(1.1), true);
    });
    it('bigint', () => {
        strictEqual(is_float(BigInt(Number.MAX_SAFE_INTEGER)), false);
    });
    it('empty array', () => {
        strictEqual(is_float([]), false);
    });
    it('array', () => {
        strictEqual(is_float(['a']), false);
    });
    it('empty object', () => {
        strictEqual(is_float({}), false);
    });
    it('object', () => {
        strictEqual(is_float({ a: true }), false);
    });
    it('boolean true', () => {
        strictEqual(is_float(true), false);
    });
    it('boolean false', () => {
        strictEqual(is_float(false), false);
    });
    it('symbol', () => {
        strictEqual(is_float(Symbol('foo')), false);
    });
    it('date', () => {
        strictEqual(is_float(new Date()), false);
    });
    it('regex', () => {
        strictEqual(is_float(/.*/), false);
    });
});
