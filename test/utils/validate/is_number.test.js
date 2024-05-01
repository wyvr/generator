import { strictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { is_number } from '../../../src/utils/validate.js';

describe('utils/validate/is_number', () => {
    it('undefined', () => {
        strictEqual(is_number(), false);
    });
    it('null', () => {
        strictEqual(is_number(null), false);
    });
    it('empty string', () => {
        strictEqual(is_number(''), false);
    });
    it('string', () => {
        strictEqual(is_number('huhu'), false);
    });
    it('int', () => {
        strictEqual(is_number(1), true);
    });
    it('float', () => {
        strictEqual(is_number(1.1), true);
    });
    it('bigint', () => {
        strictEqual(is_number(BigInt(Number.MAX_SAFE_INTEGER)), true);
    });
    it('empty array', () => {
        strictEqual(is_number([]), false);
    });
    it('array', () => {
        strictEqual(is_number(['a']), false);
    });
    it('empty object', () => {
        strictEqual(is_number({}), false);
    });
    it('object', () => {
        strictEqual(is_number({ a: true }), false);
    });
    it('boolean true', () => {
        strictEqual(is_number(true), false);
    });
    it('boolean false', () => {
        strictEqual(is_number(false), false);
    });
    it('symbol', () => {
        strictEqual(is_number(Symbol('foo')), false);
    });
    it('date', () => {
        strictEqual(is_number(new Date()), false);
    });
    it('regex', () => {
        strictEqual(is_number(/.*/), false);
    });
    it('buffer', () => {
        strictEqual(is_number(Buffer.from([])), false);
    });
    it('function', () => {
        strictEqual(
            is_number(() => {}),
            false
        );
    });
});
