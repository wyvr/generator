import { strictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { is_null } from '../../../src/utils/validate.js';

describe('utils/validate/is_null', () => {
    it('undefined', () => {
        strictEqual(is_null(), true);
    });
    it('null', () => {
        strictEqual(is_null(null), true);
    });
    it('empty string', () => {
        strictEqual(is_null(''), false);
    });
    it('string', () => {
        strictEqual(is_null('huhu'), false);
    });
    it('int', () => {
        strictEqual(is_null(1), false);
    });
    it('float', () => {
        strictEqual(is_null(1.1), false);
    });
    it('bigint', () => {
        strictEqual(is_null(BigInt(Number.MAX_SAFE_INTEGER)), false);
    });
    it('empty array', () => {
        strictEqual(is_null([]), false);
    });
    it('array', () => {
        strictEqual(is_null(['a']), false);
    });
    it('empty object', () => {
        strictEqual(is_null({}), false);
    });
    it('object', () => {
        strictEqual(is_null({ a: true }), false);
    });
    it('boolean true', () => {
        strictEqual(is_null(true), false);
    });
    it('boolean false', () => {
        strictEqual(is_null(false), false);
    });
    it('symbol', () => {
        strictEqual(is_null(Symbol('foo')), false);
    });
    it('date', () => {
        strictEqual(is_null(new Date()), false);
    });
    it('regex', () => {
        strictEqual(is_null(/.*/), false);
    });
    it('buffer', () => {
        strictEqual(is_null(Buffer.from([])), false);
    });
    it('function', () => {
        strictEqual(
            is_null(() => {}),
            false
        );
    });
});
