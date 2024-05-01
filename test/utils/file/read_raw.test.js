import { strictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { read_raw } from '../../../src/utils/file.js';

describe('utils/file/read_raw', () => {
    it('empty', () => {
        strictEqual(read_raw(), undefined);
    });
    it('non existing', () => {
        strictEqual(read_raw('unknown.txt'), undefined);
    });
});
