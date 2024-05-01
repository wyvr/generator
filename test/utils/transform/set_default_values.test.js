import { deepStrictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { set_default_values } from '../../../src/utils/transform.js';

describe('utils/transform/set_default_values', () => {
    it('undefined', () => {
        deepStrictEqual(set_default_values(), undefined);
    });
    it('only data', () => {
        deepStrictEqual(set_default_values({ value: true }, undefined), { value: true });
    });
    it('only fallback', () => {
        deepStrictEqual(set_default_values(undefined, { value: true }), { value: true });
    });
    it('replace unset value', () => {
        deepStrictEqual(set_default_values({ value: undefined }, { value: true }), { value: true });
    });
    it('merge', () => {
        deepStrictEqual(set_default_values({ a: true }, { value: true }), { a: true, value: true });
    });
});
