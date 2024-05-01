import { strictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { is_symbol } from '../../../src/utils/validate.js';

describe('utils/validate/is_symbol', () => {
    it('undefined', () => {
        strictEqual(is_symbol(), false);
    });
    it('null', () => {
        strictEqual(is_symbol(null), false);
    });
    it('empty string', () => {
        strictEqual(is_symbol(''), false);
    });
    it('string', () => {
        strictEqual(is_symbol('huhu'), false);
    });
    it('int', () => {
        strictEqual(is_symbol(1), false);
    });
    it('float', () => {
        strictEqual(is_symbol(1.1), false);
    });
    it('bigint', () => {
        strictEqual(is_symbol(BigInt(Number.MAX_SAFE_INTEGER)), false);
    });
    it('empty array', () => {
        strictEqual(is_symbol([]), false);
    });
    it('array', () => {
        strictEqual(is_symbol(['a']), false);
    });
    it('empty object', () => {
        strictEqual(is_symbol({}), false);
    });
    it('object', () => {
        strictEqual(is_symbol({ a: true }), false);
    });
    it('boolean true', () => {
        strictEqual(is_symbol(true), false);
    });
    it('boolean false', () => {
        strictEqual(is_symbol(false), false);
    });
    it('symbol', () => {
        strictEqual(is_symbol(Symbol('foo')), true);
    });
    it('date', () => {
        strictEqual(is_symbol(new Date()), false);
    });
    it('regex', () => {
        strictEqual(is_symbol(/.*/), false);
    });
    it('buffer', () => {
        strictEqual(is_symbol(Buffer.from([])), false);
    });
    it('function', () => {
        strictEqual(
            is_symbol(() => {}),
            false
        );
    });
});
