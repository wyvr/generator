import { strictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { filled_array } from '../../../src/utils/validate.js';

describe('utils/validate/filled_array', () => {
    it('undefined', () => {
        strictEqual(filled_array(), false);
    });
    it('null', () => {
        strictEqual(filled_array(null), false);
    });
    it('empty string', () => {
        strictEqual(filled_array(''), false);
    });
    it('string', () => {
        strictEqual(filled_array('huhu'), false);
    });
    it('int', () => {
        strictEqual(filled_array(1), false);
    });
    it('float', () => {
        strictEqual(filled_array(1.1), false);
    });
    it('bigint', () => {
        strictEqual(filled_array(BigInt(Number.MAX_SAFE_INTEGER)), false);
    });
    it('empty array', () => {
        strictEqual(filled_array([]), false);
    });
    it('array', () => {
        strictEqual(filled_array(['a']), true);
    });
    it('empty object', () => {
        strictEqual(filled_array({}), false);
    });
    it('object', () => {
        strictEqual(filled_array({ a: true }), false);
    });
    it('boolean true', () => {
        strictEqual(filled_array(true), false);
    });
    it('boolean false', () => {
        strictEqual(filled_array(false), false);
    });
    it('symbol', () => {
        strictEqual(filled_array(Symbol('foo')), false);
    });
    it('date', () => {
        strictEqual(filled_array(new Date()), false);
    });
    it('regex', () => {
        strictEqual(filled_array(/.*/), false);
    });
    it('buffer', () => {
        strictEqual(filled_array(Buffer.from([])), false);
    });
    it('function', () => {
        strictEqual(
            filled_array(() => {}),
            false
        );
    });
});
