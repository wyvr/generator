import { strictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { remove } from '../../../src/utils/file.js';
import { dirname } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';

describe('utils/file/remove', () => {
    it('undefined', () => {
        strictEqual(remove(), false);
    });
    it('non existing', () => {
        strictEqual(remove('test/utils/file/_tests/nonexisting'), false);
    });
    it('existing', () => {
        const filename = 'test/utils/file/_tests/existing.txt';
        writeFileSync(filename, '');
        strictEqual(remove(filename), true);
    });
    it('remove dir', () => {
        const filename = 'test/utils/file/_tests/delete/foldertest.txt';
        mkdirSync(dirname(filename));
        writeFileSync(filename, '');
        strictEqual(remove(dirname(filename)), true);
    });
});
