import { deepStrictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { uniq_values } from '../../../src/utils/uniq.js';

describe('utils/uniq/uniq_values', () => {
    it('undefined', () => {
        deepStrictEqual(uniq_values(), []);
    });
    it('null', () => {
        deepStrictEqual(uniq_values(null), []);
    });
    it('empty string', () => {
        deepStrictEqual(uniq_values(['']), ['']);
    });
    it('string', () => {
        deepStrictEqual(uniq_values('huhu'), ['huhu']);
    });
    it('number', () => {
        deepStrictEqual(uniq_values(1), [1]);
    });
    it('empty array', () => {
        deepStrictEqual(uniq_values([]), []);
    });
    it('array', () => {
        deepStrictEqual(uniq_values(['a', 'b', 'a']), ['a', 'b']);
    });
    it('number string mixed', () => {
        deepStrictEqual(uniq_values(['1', 1]), ['1', 1]);
    });
    it('object', () => {
        deepStrictEqual(uniq_values([{ a: true }, { b: true }, { a: true }]), [{ a: true }, { b: true }, { a: true }]);
    });
});
