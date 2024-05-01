import { strictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { is_buffer } from '../../../src/utils/validate.js';

describe('utils/validate/is_buffer', () => {
    it('undefined', () => {
        strictEqual(is_buffer(), false);
    });
    it('null', () => {
        strictEqual(is_buffer(null), false);
    });
    it('empty string', () => {
        strictEqual(is_buffer(''), false);
    });
    it('string', () => {
        strictEqual(is_buffer('huhu'), false);
    });
    it('int', () => {
        strictEqual(is_buffer(1), false);
    });
    it('float', () => {
        strictEqual(is_buffer(1.1), false);
    });
    it('bigint', () => {
        strictEqual(is_buffer(BigInt(Number.MAX_SAFE_INTEGER)), false);
    });
    it('empty array', () => {
        strictEqual(is_buffer([]), false);
    });
    it('array', () => {
        strictEqual(is_buffer(['a']), false);
    });
    it('empty object', () => {
        strictEqual(is_buffer({}), false);
    });
    it('object', () => {
        strictEqual(is_buffer({ a: true }), false);
    });
    it('boolean true', () => {
        strictEqual(is_buffer(true), false);
    });
    it('boolean false', () => {
        strictEqual(is_buffer(false), false);
    });
    it('symbol', () => {
        strictEqual(is_buffer(Symbol('foo')), false);
    });
    it('date', () => {
        strictEqual(is_buffer(new Date()), false);
    });
    it('regex', () => {
        strictEqual(is_buffer(/.*/), false);
    });
    it('buffer', () => {
        strictEqual(is_buffer(Buffer.from([])), true);
    });
    it('function', () => {
        strictEqual(
            is_buffer(() => {}),
            false
        );
    });
});
