import { strictEqual, deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { read_json } from '../../../src/utils/file.js';

describe('utils/file/read_buffer', () => {
    it('non existing', () => {
        strictEqual(read_json('unknown.txt'), undefined);
    });
    it('empty file', () => {
        strictEqual(read_json('test/utils/file/_tests/empty.txt'), undefined);
    });
    it('invalid text file', () => {
        strictEqual(read_json('test/utils/file/_tests/text.txt'), undefined);
    });
    it('valid json', () => {
        deepStrictEqual(read_json('test/utils/file/_tests/valid.json'), { key: 'value' });
    });
});
