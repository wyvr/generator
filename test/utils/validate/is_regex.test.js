import { strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { is_regex } from '../../../src/utils/validate.js';

describe('utils/validate/is_regex', () => {
    it('undefined', () => {
        strictEqual(is_regex(), false);
    });
    it('null', () => {
        strictEqual(is_regex(null), false);
    });
    it('empty string', () => {
        strictEqual(is_regex(''), false);
    });
    it('string', () => {
        strictEqual(is_regex('huhu'), false);
    });
    it('int', () => {
        strictEqual(is_regex(1), false);
    });
    it('float', () => {
        strictEqual(is_regex(1.1), false);
    });
    it('bigint', () => {
        strictEqual(is_regex(BigInt(Number.MAX_SAFE_INTEGER)), false);
    });
    it('empty array', () => {
        strictEqual(is_regex([]), false);
    });
    it('array', () => {
        strictEqual(is_regex(['a']), false);
    });
    it('empty object', () => {
        strictEqual(is_regex({}), false);
    });
    it('object', () => {
        strictEqual(is_regex({ a: true }), false);
    });
    it('boolean true', () => {
        strictEqual(is_regex(true), false);
    });
    it('boolean false', () => {
        strictEqual(is_regex(false), false);
    });
    it('symbol', () => {
        strictEqual(is_regex(Symbol('foo')), false);
    });
    it('date', () => {
        strictEqual(is_regex(new Date()), false);
    });
    it('regex', () => {
        strictEqual(is_regex(/.*/), true);
    });
    it('buffer', () => {
        strictEqual(is_regex(Buffer.from([])), false);
    });
    it('function', () => {
        strictEqual(
            is_regex(() => {}),
            false
        );
    });
});
