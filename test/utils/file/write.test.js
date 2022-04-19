import { strictEqual } from 'assert';
import { readFileSync, rmSync } from 'fs';
import { describe, it } from 'mocha';
import { write } from '../../../src/utils/file.js';

describe('utils/file/write', () => {
    it('no filename', () => {
        strictEqual(write(), false);
    });
    it('no content', () => {
        strictEqual(write('test/utils/file/_tests/no_content.txt'), false);
    });
    it('content', () => {
        const filename = 'test/utils/file/_tests/dyn_create.txt';
        strictEqual(write(filename, 'text'), true);
        strictEqual(readFileSync(filename, { encoding: 'utf-8' }), 'text');
        rmSync(filename, { force: true });
    });
});
