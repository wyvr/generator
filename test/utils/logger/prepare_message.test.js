import { deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { Logger } from '../../../src/utils/logger.js';

describe('utils/logger/prepare_message', () => {
    it('undefined', () => {
        deepStrictEqual(Logger.prepare_message(), []);
    });
    it('empty', () => {
        deepStrictEqual(Logger.prepare_message([]), []);
    });
    it('wrong type', () => {
        deepStrictEqual(Logger.prepare_message(true), []);
    });
    it('null', () => {
        deepStrictEqual(Logger.prepare_message([null]), ['null']);
    });
    it('empty string', () => {
        deepStrictEqual(Logger.prepare_message(['']), []);
    });
    it('string', () => {
        deepStrictEqual(Logger.prepare_message(['huhu']), ['huhu']);
    });
    it('int', () => {
        deepStrictEqual(Logger.prepare_message([1]), ['1']);
    });
    it('float', () => {
        deepStrictEqual(Logger.prepare_message([1.1]), ['1.1']);
    });
    it('bigint', () => {
        deepStrictEqual(Logger.prepare_message([BigInt(Number.MAX_SAFE_INTEGER)]), [
            BigInt(Number.MAX_SAFE_INTEGER).toString(),
        ]);
    });
    it('empty array', () => {
        deepStrictEqual(Logger.prepare_message([]), []);
    });
    it('array', () => {
        deepStrictEqual(Logger.prepare_message([['a']]), ['["a"]']);
    });
    it('empty object', () => {
        deepStrictEqual(Logger.prepare_message([{}]), ['{}']);
    });
    it('object', () => {
        deepStrictEqual(Logger.prepare_message([{ a: true }]), ['{"a":true}']);
    });
    it('boolean true', () => {
        deepStrictEqual(Logger.prepare_message([true]), ['true']);
    });
    it('boolean false', () => {
        deepStrictEqual(Logger.prepare_message([false]), ['false']);
    });
    it('symbol', () => {
        deepStrictEqual(Logger.prepare_message([Symbol('foo')]), ['Symbol(foo)']);
    });
    it('date', () => {
        const date = new Date();
        deepStrictEqual(Logger.prepare_message([date]), [JSON.stringify(date)]);
    });
    it('regex', () => {
        deepStrictEqual(Logger.prepare_message([/.*/]), ['/.*/']);
    });
});
