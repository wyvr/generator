import { strictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { is_func } from '../../../src/utils/validate.js';

describe('utils/validate/is_func', () => {
    it('undefined', () => {
        strictEqual(is_func(), false);
    });
    it('null', () => {
        strictEqual(is_func(null), false);
    });
    it('empty string', () => {
        strictEqual(is_func(''), false);
    });
    it('string', () => {
        strictEqual(is_func('huhu'), false);
    });
    it('int', () => {
        strictEqual(is_func(1), false);
    });
    it('float', () => {
        strictEqual(is_func(1.1), false);
    });
    it('bigint', () => {
        strictEqual(is_func(BigInt(Number.MAX_SAFE_INTEGER)), false);
    });
    it('empty array', () => {
        strictEqual(is_func([]), false);
    });
    it('array', () => {
        strictEqual(is_func(['a']), false);
    });
    it('empty object', () => {
        strictEqual(is_func({}), false);
    });
    it('object', () => {
        strictEqual(is_func({ a: true }), false);
    });
    it('boolean true', () => {
        strictEqual(is_func(true), false);
    });
    it('boolean false', () => {
        strictEqual(is_func(false), false);
    });
    it('symbol', () => {
        strictEqual(is_func(Symbol('foo')), false);
    });
    it('date', () => {
        strictEqual(is_func(new Date()), false);
    });
    it('regex', () => {
        strictEqual(is_func(/.*/), false);
    });
    it('buffer', () => {
        strictEqual(is_func(Buffer.from([])), false);
    });
    it('function', () => {
        strictEqual(
            is_func(() => {}),
            true
        );
    });
});
