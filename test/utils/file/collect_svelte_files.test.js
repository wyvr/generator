import { deepStrictEqual } from 'node:assert';
import { before, describe, it } from 'mocha';
import { collect_svelte_files } from '../../../src/utils/file.js';
import { WyvrFile } from '../../../src/model/wyvr_file.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/file/collect_svelte_files', () => {
    before(() => {
        Cwd.set(process.cwd());
    });
    it('default folder', () => {
        deepStrictEqual(collect_svelte_files(), []);
        deepStrictEqual(collect_svelte_files(''), []);
    });
    it('unknown folder', () => {
        deepStrictEqual(collect_svelte_files('unknown_folder'), []);
    });
    it('partial unknown folder', () => {
        deepStrictEqual(collect_svelte_files('test/utils/file/_tests/unknown_folder'), []);
    });
    it('found files', () => {
        deepStrictEqual(collect_svelte_files('test/utils/file/_tests/svelte'), [
            WyvrFile('test/utils/file/_tests/svelte/a.svelte'),
            WyvrFile('test/utils/file/_tests/svelte/b/b.svelte'),
        ]);
    });
    it('found files deep', () => {
        deepStrictEqual(collect_svelte_files('test/utils/file/_tests'), [
            WyvrFile('test/utils/file/_tests/link/a.svelte'),
            WyvrFile('test/utils/file/_tests/link/b/b.svelte'),
            WyvrFile('test/utils/file/_tests/svelte/a.svelte'),
            WyvrFile('test/utils/file/_tests/svelte/b/b.svelte'),
        ]);
    });
});
