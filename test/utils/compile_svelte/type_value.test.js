import { deepStrictEqual, strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { type_value } from '../../../src/utils/compile_svelte.js';

describe('utils/compile_svelte/type_value', () => {
    it('undefined', async () => {
        deepStrictEqual(type_value(), undefined);
    });
    it('unmatched name', async () => {
        deepStrictEqual(type_value('huhu', true, false), undefined);
    });
    it('client', async () => {
        deepStrictEqual(type_value('client', true, false), true);
    });
    it('server', async () => {
        deepStrictEqual(type_value('server', false, true), true);
    });
});
