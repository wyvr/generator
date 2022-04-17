import { strictEqual, deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { collect_files } from '../../../src/utils/file.js';

describe('utils/file/collect_files', () => {
    it('default folder', () => {
        deepStrictEqual(collect_files(), []);
        deepStrictEqual(collect_files(''), []);
        deepStrictEqual(collect_files('', null), []);
        deepStrictEqual(collect_files(null, null), []);
        deepStrictEqual(collect_files('test/utils/file/_tests/svelte', 'txt'), [
            'test/utils/file/_tests/svelte/nosvelte.txt',
        ]);
    });
    it('unknown folder', () => {
        deepStrictEqual(collect_files('unknown_folder', 'txt'), []);
        deepStrictEqual(collect_files('unknown_folder', '.txt'), []);
    });
    it('partial unknown folder', () => {
        deepStrictEqual(collect_files('test/utils/file/_tests/unknown_folder', 'txt'), []);
        deepStrictEqual(collect_files('test/utils/file/_tests/unknown_folder', '.txt'), []);
    });
    it('collect all files', () => {
        deepStrictEqual(collect_files('test/utils/file/_tests/svelte', null), [
            'test/utils/file/_tests/svelte/a.svelte',
            'test/utils/file/_tests/svelte/b/b.svelte',
            'test/utils/file/_tests/svelte/nosvelte.txt',
        ]);
    });
    it('collect only svelte without dot', () => {
        deepStrictEqual(collect_files('test/utils/file/_tests', 'svelte'), [
            'test/utils/file/_tests/link/a.svelte',
            'test/utils/file/_tests/link/b/b.svelte',
            'test/utils/file/_tests/svelte/a.svelte',
            'test/utils/file/_tests/svelte/b/b.svelte',
        ]);
    });
    it('collect only svelte with dot', () => {
        deepStrictEqual(collect_files('test/utils/file/_tests', '.svelte'), [
            'test/utils/file/_tests/link/a.svelte',
            'test/utils/file/_tests/link/b/b.svelte',
            'test/utils/file/_tests/svelte/a.svelte',
            'test/utils/file/_tests/svelte/b/b.svelte',
        ]);
    });
});
