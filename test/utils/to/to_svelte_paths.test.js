import { deepStrictEqual } from 'node:assert';
import { describe } from 'mocha';
import { to_dirname, to_svelte_paths } from '../../../src/utils/to.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/to/to_svelte_paths', () => {
    const __dirname = to_dirname(import.meta.url);
    before(() => {
        Cwd.set(__dirname);
    });
    after(() => {
        Cwd.set(undefined);
    });
    it('undefined', () => {
        deepStrictEqual(to_svelte_paths(), undefined);
    });
    it('empty string', () => {
        deepStrictEqual(to_svelte_paths(''), undefined);
    });
    it('empty array', () => {
        deepStrictEqual(to_svelte_paths([]), undefined);
    });
    it('string', () => {
        deepStrictEqual(to_svelte_paths('Default'), ['Default.svelte']);
    });
    it('array', () => {
        deepStrictEqual(to_svelte_paths(['Default', 'Page']), ['Default.svelte', 'Page.svelte']);
    });
    it('partially fullfilled array', () => {
        deepStrictEqual(to_svelte_paths(['Default.svelte', 'Page']), ['Default.svelte', 'Page.svelte']);
    });
});
