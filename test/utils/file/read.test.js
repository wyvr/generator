import { strictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { read } from '../../../src/utils/file.js';

describe('utils/file/read_buffer', () => {
    it('empty file', () => {
        strictEqual(read('test/utils/file/_tests/empty.txt'), undefined);
    });
    it('match content', () => {
        strictEqual(read('test/utils/file/_tests/text.txt'), 'text');
    });
});
