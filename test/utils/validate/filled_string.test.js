import { strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { filled_string } from '../../../src/utils/validate.js';

describe('utils/validate/filled_string', () => {
    it('undefined', () => {
        strictEqual(filled_string(), false);
    });
    it('null', () => {
        strictEqual(filled_string(null), false);
    });
    it('empty string', () => {
        strictEqual(filled_string(''), false);
    });
    it('empty string with whitespace', () => {
        strictEqual(filled_string('         '), false);
    });
    it('string', () => {
        strictEqual(filled_string('huhu'), true);
    });
    it('int', () => {
        strictEqual(filled_string(1), false);
    });
    it('float', () => {
        strictEqual(filled_string(1.1), false);
    });
    it('bigint', () => {
        strictEqual(filled_string(BigInt(Number.MAX_SAFE_INTEGER)), false);
    });
    it('empty array', () => {
        strictEqual(filled_string([]), false);
    });
    it('array', () => {
        strictEqual(filled_string(['a']), false);
    });
    it('empty object', () => {
        strictEqual(filled_string({}), false);
    });
    it('object', () => {
        strictEqual(filled_string({ a: true }), false);
    });
    it('boolean true', () => {
        strictEqual(filled_string(true), false);
    });
    it('boolean false', () => {
        strictEqual(filled_string(false), false);
    });
    it('symbol', () => {
        strictEqual(filled_string(Symbol('foo')), false);
    });
    it('date', () => {
        strictEqual(filled_string(new Date()), false);
    });
    it('regex', () => {
        strictEqual(filled_string(/.*/), false);
    });
    it('buffer', () => {
        strictEqual(filled_string(Buffer.from([])), false);
    });
    it('function', () => {
        strictEqual(
            filled_string(() => {}),
            false
        );
    });
});
