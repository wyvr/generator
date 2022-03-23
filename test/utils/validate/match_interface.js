import { strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { match_interface } from '../../../src/utils/validate.js';

describe('utils/validate/match_interface', () => {
    it('undefined', () => {
        strictEqual(match_interface(), false);
    });
    it('null', () => {
        strictEqual(match_interface(null), false);
    });
    it('empty string', () => {
        strictEqual(match_interface(''), false);
    });
    it('string', () => {
        strictEqual(match_interface('huhu'), false);
    });
    it('int', () => {
        strictEqual(match_interface(1), false);
    });
    it('float', () => {
        strictEqual(match_interface(1.1), false);
    });
    it('bigint', () => {
        strictEqual(match_interface(BigInt(Number.MAX_SAFE_INTEGER)), false);
    });
    it('empty array', () => {
        strictEqual(match_interface([]), false);
    });
    it('array', () => {
        strictEqual(match_interface(['a']), false);
    });
    it('empty object', () => {
        strictEqual(match_interface({}), false);
    });
    it('object', () => {
        strictEqual(match_interface({ a: true }), false);
    });
    it('boolean true', () => {
        strictEqual(match_interface(true), false);
    });
    it('boolean false', () => {
        strictEqual(match_interface(false), false);
    });
    it('symbol', () => {
        strictEqual(match_interface(Symbol('foo')), false);
    });
    it('date', () => {
        strictEqual(match_interface(new Date()), false);
    });
    it('regex', () => {
        strictEqual(match_interface(/.*/), false);
    });

    it('match interface', () => {
        strictEqual(match_interface({ a: 'required', b: 'required', c: 'optional' }, { a: true, b: true }), true);
    });
    it('match subset interface', () => {
        strictEqual(match_interface({ a: 'required', b: 'required' }, { a: true }), true);
    });
    it('match empty interface', () => {
        strictEqual(match_interface({ a: 'required', b: 'required' }, {}), true);
    });
    it('mismatch interface', () => {
        strictEqual(match_interface({ a: 'required', b: 'required' }, { c: true }), false);
    });
});
