import { strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { is_bool } from '../../../src/utils/validate.js';

describe('utils/validate/is_bool', () => {
    it('undefined', () => {
        strictEqual(is_bool(), false);
    });
    it('null', () => {
        strictEqual(is_bool(null), false);
    });
    it('empty string', () => {
        strictEqual(is_bool(''), false);
    });
    it('string', () => {
        strictEqual(is_bool('huhu'), false);
    });
    it('int', () => {
        strictEqual(is_bool(1), false);
    });
    it('float', () => {
        strictEqual(is_bool(1.1), false);
    });
    it('bigint', () => {
        strictEqual(is_bool(BigInt(Number.MAX_SAFE_INTEGER)), false);
    });
    it('empty array', () => {
        strictEqual(is_bool([]), false);
    });
    it('array', () => {
        strictEqual(is_bool(['a']), false);
    });
    it('empty object', () => {
        strictEqual(is_bool({}), false);
    });
    it('object', () => {
        strictEqual(is_bool({ a: true }), false);
    });
    it('boolean true', () => {
        strictEqual(is_bool(true), true);
    });
    it('boolean false', () => {
        strictEqual(is_bool(false), true);
    });
    it('symbol', () => {
        strictEqual(is_bool(Symbol('foo')), false);
    });
    it('date', () => {
        strictEqual(is_bool(new Date()), false);
    });
    it('regex', () => {
        strictEqual(is_bool(/.*/), false);
    });
    it('buffer', () => {
        strictEqual(is_bool(Buffer.from([])), false);
    });
    it('function', () => {
        strictEqual(
            is_bool(() => {}),
            false
        );
    });
});
