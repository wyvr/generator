import { strictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { filled_object } from '../../../src/utils/validate.js';

describe('utils/validate/filled_object', () => {
    it('undefined', () => {
        strictEqual(filled_object(), false);
    });
    it('null', () => {
        strictEqual(filled_object(null), false);
    });
    it('empty string', () => {
        strictEqual(filled_object(''), false);
    });
    it('string', () => {
        strictEqual(filled_object('huhu'), false);
    });
    it('int', () => {
        strictEqual(filled_object(1), false);
    });
    it('float', () => {
        strictEqual(filled_object(1.1), false);
    });
    it('bigint', () => {
        strictEqual(filled_object(BigInt(Number.MAX_SAFE_INTEGER)), false);
    });
    it('empty array', () => {
        strictEqual(filled_object([]), false);
    });
    it('array', () => {
        strictEqual(filled_object(['a']), false);
    });
    it('empty object', () => {
        strictEqual(filled_object({}), false);
    });
    it('object', () => {
        strictEqual(filled_object({ a: true }), true);
    });
    it('boolean true', () => {
        strictEqual(filled_object(true), false);
    });
    it('boolean false', () => {
        strictEqual(filled_object(false), false);
    });
    it('symbol', () => {
        strictEqual(filled_object(Symbol('foo')), false);
    });
    it('date', () => {
        strictEqual(filled_object(new Date()), false);
    });
    it('regex', () => {
        strictEqual(filled_object(/.*/), false);
    });
    it('buffer', () => {
        strictEqual(filled_object(Buffer.from([])), false);
    });
    it('function', () => {
        strictEqual(
            filled_object(() => {}),
            false
        );
    });
});
