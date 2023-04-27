import { deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { RegenerateFragment } from '../../src/model/regenerate_fragment.mjs';

describe('model/regenerate_fragment', () => {
    it('default values', () => {
        const fragment = new RegenerateFragment();
        deepStrictEqual(fragment, { change: [], add: [], unlink: [] });
    });
    it('wrong type', () => {
        const fragment = new RegenerateFragment(true);
        deepStrictEqual(fragment, { change: [], add: [], unlink: [] });
    });
    it('unknown type', () => {
        const fragment = new RegenerateFragment({ a: ['yes'] });
        deepStrictEqual(fragment, { change: [], add: [], unlink: [] });
    });
    it('set correct values', () => {
        const fragment = new RegenerateFragment({ change: ['change'], add: ['add'], unlink: ['unlink'] });
        deepStrictEqual(fragment, { change: ['change'], add: ['add'], unlink: ['unlink'] });
    });
});
