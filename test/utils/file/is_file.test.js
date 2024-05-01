import { strictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { is_file } from '../../../src/utils/file.js';

describe('utils/file/is_file', () => {
    it('no file', () => {
        strictEqual(is_file(), false);
    });
    it('empty string', () => {
        strictEqual(is_file(''), false);
    });
    it('symlink', () => {
        strictEqual(is_file('test/utils/file/_tests/link'), false);
    });
    it('dir', () => {
        strictEqual(is_file('test'), false);
    });
    it('deep dir', () => {
        strictEqual(is_file('test/utils/file/_tests'), false);
    });
    it('file', () => {
        strictEqual(is_file('test/utils/file/_tests/svelte/a.svelte'), true);
    });
});
