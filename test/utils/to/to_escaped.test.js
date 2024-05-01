import { strictEqual, deepStrictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { to_escaped } from '../../../src/utils/to.js';

describe('utils/to/to_escaped', () => {
    it('undefined', () => {
        strictEqual(to_escaped(), 'undefined');
    });
    it('null', () => {
        strictEqual(to_escaped(null), 'null');
    });
    it('empty string', () => {
        strictEqual(to_escaped(''), '""');
    });
    it('string', () => {
        strictEqual(to_escaped('huhu'), '"huhu"');
    });
    it('string with single quote', () => {
        strictEqual(to_escaped("hu'hu"), '"hu\'\'hu"');
    });
    it('int', () => {
        strictEqual(to_escaped(1), '1');
    });
    it('float', () => {
        strictEqual(to_escaped(1.1), '1.1');
    });
    it('bigint', () => {
        strictEqual(to_escaped(BigInt(Number.MAX_SAFE_INTEGER)), '9007199254740991');
    });
    it('empty array', () => {
        strictEqual(to_escaped([]), '[]');
    });
    it('array', () => {
        strictEqual(to_escaped(['a']), '["a"]');
    });
    it('empty object', () => {
        strictEqual(to_escaped({}), '{}');
    });
    it('object', () => {
        strictEqual(to_escaped({ a: true }), '{"a":true}');
    });
    it('boolean true', () => {
        strictEqual(to_escaped(true), 'true');
    });
    it('boolean false', () => {
        strictEqual(to_escaped(false), 'false');
    });
    it('symbol', () => {
        strictEqual(to_escaped(Symbol('foo')), '"Symbol(foo)"');
    });
    it('date', () => {
        const date = new Date()
        strictEqual(typeof to_escaped(date), 'string');
    });
    it('regex', () => {
        strictEqual(to_escaped(/.*/), '"/.*/"');
    });
});
