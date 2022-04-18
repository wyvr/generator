import { strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { is_object } from '../../../src/utils/validate.js';

describe('utils/validate/is_object', () => {
    it('undefined', () => {
        strictEqual(is_object(), false);
    });
    it('null', () => {
        strictEqual(is_object(null), false);
    });
    it('empty string', () => {
        strictEqual(is_object(''), false);
    });
    it('string', () => {
        strictEqual(is_object('huhu'), false);
    });
    it('int', () => {
        strictEqual(is_object(1), false);
    });
    it('float', () => {
        strictEqual(is_object(1.1), false);
    });
    it('bigint', () => {
        strictEqual(is_object(BigInt(Number.MAX_SAFE_INTEGER)), false);
    });
    it('empty array', () => {
        strictEqual(is_object([]), false);
    });
    it('array', () => {
        strictEqual(is_object(['a']), false);
    });
    it('empty object', () => {
        strictEqual(is_object({}), true);
    });
    it('object', () => {
        strictEqual(is_object({ a: true }), true);
    });
    it('boolean true', () => {
        strictEqual(is_object(true), false);
    });
    it('boolean false', () => {
        strictEqual(is_object(false), false);
    });
    it('symbol', () => {
        strictEqual(is_object(Symbol('foo')), false);
    });
    it('date', () => {
        strictEqual(is_object(new Date()), false);
    });
    it('regex', () => {
        strictEqual(is_object(/.*/), false);
    });
    it('function', () => {
        strictEqual(
            is_object(() => {}),
            false
        );
    });
});
