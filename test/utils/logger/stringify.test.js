import { strictEqual, deepStrictEqual } from 'assert';
import kleur from 'kleur';
import { describe, it } from 'mocha';
import { Logger } from '../../../src/utils/logger.js';

describe('utils/logger/stringify', () => {
    it('undefined', () => {
        strictEqual(Logger.stringify(), undefined);
    });
    it('null', () => {
        strictEqual(Logger.stringify(null), 'null');
    });
    it('empty string', () => {
        strictEqual(Logger.stringify(''), '');
    });
    it('string', () => {
        strictEqual(Logger.stringify('huhu'), 'huhu');
    });
    it('int', () => {
        strictEqual(Logger.stringify(1), '1');
    });
    it('float', () => {
        strictEqual(Logger.stringify(1.1), '1.1');
    });
    it('bigint', () => {
        strictEqual(Logger.stringify(BigInt(Number.MAX_SAFE_INTEGER)), BigInt(Number.MAX_SAFE_INTEGER).toString());
    });
    it('empty array', () => {
        strictEqual(Logger.stringify([]), '[]');
    });
    it('array', () => {
        strictEqual(Logger.stringify(['a']), '["a"]');
    });
    it('empty object', () => {
        strictEqual(Logger.stringify({}), '{}');
    });
    it('object', () => {
        strictEqual(Logger.stringify({ a: true }), '{"a":true}');
    });
    it('boolean true', () => {
        strictEqual(Logger.stringify(true), 'true');
    });
    it('boolean false', () => {
        strictEqual(Logger.stringify(false), 'false');
    });
    it('symbol', () => {
        strictEqual(Logger.stringify(Symbol('foo')), 'Symbol(foo)');
    });
    it('date', () => {
        const date = new Date();
        strictEqual(Logger.stringify(date), JSON.stringify(date));
    });
    it('regex', () => {
        strictEqual(Logger.stringify(/.*/), '/.*/');
    });
    it('color', () => {
        strictEqual(Logger.stringify(kleur.green('text')), kleur.green('text'));
    });
});
