import { strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { is_date } from '../../../src/utils/validate.js';

describe('utils/validate/is_date', () => {
    it('undefined', () => {
        strictEqual(is_date(), false);
    });
    it('null', () => {
        strictEqual(is_date(null), false);
    });
    it('empty string', () => {
        strictEqual(is_date(''), false);
    });
    it('string', () => {
        strictEqual(is_date('huhu'), false);
    });
    it('int', () => {
        strictEqual(is_date(1), false);
    });
    it('float', () => {
        strictEqual(is_date(1.1), false);
    });
    it('bigint', () => {
        strictEqual(is_date(BigInt(Number.MAX_SAFE_INTEGER)), false);
    });
    it('empty array', () => {
        strictEqual(is_date([]), false);
    });
    it('array', () => {
        strictEqual(is_date(['a']), false);
    });
    it('empty object', () => {
        strictEqual(is_date({}), false);
    });
    it('object', () => {
        strictEqual(is_date({ a: true }), false);
    });
    it('boolean true', () => {
        strictEqual(is_date(true), false);
    });
    it('boolean false', () => {
        strictEqual(is_date(false), false);
    });
    it('symbol', () => {
        strictEqual(is_date(Symbol('foo')), false);
    });
    it('date', () => {
        strictEqual(is_date(new Date()), true);
    });
    it('regex', () => {
        strictEqual(is_date(/.*/), false);
    });
    it('buffer', () => {
        strictEqual(is_date(Buffer.from([])), false);
    });
    it('function', () => {
        strictEqual(
            is_date(() => {}),
            false
        );
    });
});
