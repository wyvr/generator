import { deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { read_buffer } from '../../../src/utils/file.js';

describe('utils/file/read_buffer', () => {
    it('match buffer', () => {
        deepStrictEqual(read_buffer('test/utils/file/_tests/text.txt'), Buffer.from('text', 'utf-8'));
    });
});
