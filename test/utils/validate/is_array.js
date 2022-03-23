import { strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { is_array } from '../../../src/utils/validate.js';

describe('utils/validate/is_array', () => {
    it('undefined', () => {
        strictEqual(is_array(), false);
    });
    it('null', () => {
        strictEqual(is_array(null), false);
    });
    it('empty string', () => {
        strictEqual(is_array(''), false);
    });
    it('string', () => {
        strictEqual(is_array('huhu'), false);
    });
    it('int', () => {
        strictEqual(is_array(1), false);
    });
    it('float', () => {
        strictEqual(is_array(1.1), false);
    });
    it('bigint', () => {
        strictEqual(is_array(BigInt(Number.MAX_SAFE_INTEGER)), false);
    });
    it('empty array', () => {
        strictEqual(is_array([]), true);
    });
    it('array', () => {
        strictEqual(is_array(['a']), true);
    });
    it('empty object', () => {
        strictEqual(is_array({}), false);
    });
    it('object', () => {
        strictEqual(is_array({ a: true }), false);
    });
    it('boolean true', () => {
        strictEqual(is_array(true), false);
    });
    it('boolean false', () => {
        strictEqual(is_array(false), false);
    });
    it('symbol', () => {
        strictEqual(is_array(Symbol('foo')), false);
    });
    it('date', () => {
        strictEqual(is_array(new Date()), false);
    });
    it('regex', () => {
        strictEqual(is_array(/.*/), false);
    });
});
