import { strictEqual, deepStrictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { to_string } from '../../../src/utils/to.js';

describe('utils/to/to_string', () => {
    it('undefined', () => {
        strictEqual(to_string(), 'undefined');
    });
    it('null', () => {
        strictEqual(to_string(null), 'null');
    });
    it('empty string', () => {
        strictEqual(to_string(''), '');
    });
    it('string', () => {
        strictEqual(to_string('huhu'), 'huhu');
    });
    it('int', () => {
        strictEqual(to_string(1), '1');
    });
    it('float', () => {
        strictEqual(to_string(1.1), '1.1');
    });
    it('bigint', () => {
        strictEqual(to_string(BigInt(Number.MAX_SAFE_INTEGER)), '9007199254740991');
    });
    it('empty array', () => {
        strictEqual(to_string([]), '[]');
    });
    it('array', () => {
        strictEqual(to_string(['a']), '["a"]');
    });
    it('empty object', () => {
        strictEqual(to_string({}), '{}');
    });
    it('object', () => {
        strictEqual(to_string({ a: true }), '{"a":true}');
    });
    it('boolean true', () => {
        strictEqual(to_string(true), 'true');
    });
    it('boolean false', () => {
        strictEqual(to_string(false), 'false');
    });
    it('symbol', () => {
        strictEqual(to_string(Symbol('foo')), 'Symbol(foo)');
    });
    it('date', () => {
        const date = new Date();
        strictEqual(to_string(date), date.toString());
    });
    it('regex', () => {
        strictEqual(to_string(/.*/), '/.*/');
    });
});
