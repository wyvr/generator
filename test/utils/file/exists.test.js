import { strictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { exists } from '../../../src/utils/file.js';

describe('utils/file/exists', () => {
    it('no file', () => {
        strictEqual(exists(), false);
    });
    it('empty string', () => {
        strictEqual(exists(''), false);
    });
    it('symlink', () => {
        strictEqual(exists('test/utils/file/_tests/link'), true);
    });
    it('dir', () => {
        strictEqual(exists('test'), true);
    });
    it('deep dir', () => {
        strictEqual(exists('test/utils/file/_tests'), true);
    });
    it('file', () => {
        strictEqual(exists('test/utils/file/_tests/svelte/a.svelte'), true);
    });
});
