import { strictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { is_dir } from '../../../src/utils/file.js';

describe('utils/file/is_dir', () => {
    it('no file', () => {
        strictEqual(is_dir(), false);
    });
    it('empty string', () => {
        strictEqual(is_dir(''), false);
    });
    it('symlink', () => {
        strictEqual(is_dir('test/utils/file/_tests/link'), true);
    });
    it('dir', () => {
        strictEqual(is_dir('test'), true);
    });
    it('deep dir', () => {
        strictEqual(is_dir('test/utils/file/_tests'), true);
    });
    it('file', () => {
        strictEqual(is_dir('test/utils/file/_tests/svelte/a.svelte'), false);
    });
});
