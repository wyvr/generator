import { strictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { is_string } from '../../../src/utils/validate.js';

describe('utils/validate/is_string', () => {
    it('undefined', () => {
        strictEqual(is_string(), false);
    });
    it('null', () => {
        strictEqual(is_string(null), false);
    });
    it('empty string', () => {
        strictEqual(is_string(''), true);
    });
    it('string', () => {
        strictEqual(is_string('huhu'), true);
    });
    it('int', () => {
        strictEqual(is_string(1), false);
    });
    it('float', () => {
        strictEqual(is_string(1.1), false);
    });
    it('bigint', () => {
        strictEqual(is_string(BigInt(Number.MAX_SAFE_INTEGER)), false);
    });
    it('empty array', () => {
        strictEqual(is_string([]), false);
    });
    it('array', () => {
        strictEqual(is_string(['a']), false);
    });
    it('empty object', () => {
        strictEqual(is_string({}), false);
    });
    it('object', () => {
        strictEqual(is_string({ a: true }), false);
    });
    it('boolean true', () => {
        strictEqual(is_string(true), false);
    });
    it('boolean false', () => {
        strictEqual(is_string(false), false);
    });
    it('symbol', () => {
        strictEqual(is_string(Symbol('foo')), false);
    });
    it('date', () => {
        strictEqual(is_string(new Date()), false);
    });
    it('regex', () => {
        strictEqual(is_string(/.*/), false);
    });
    it('buffer', () => {
        strictEqual(is_string(Buffer.from([])), false);
    });
    it('function', () => {
        strictEqual(
            is_string(() => {}),
            false
        );
    });
});
