import { deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { join } from 'path';
import { get_file_time_hash } from '../../../src/utils/hash.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/hash/get_file_time_hash', () => {
    const path = join(process.cwd(), 'test', 'utils', 'hash', '_tests');

    before(async () => {
        Cwd.set(path);
    });
    beforeEach(() => {});
    afterEach(() => {});
    after(() => {
        Cwd.set(undefined);
    });
    it('undefined', () => {
        const result = get_file_time_hash();
        deepStrictEqual(result, undefined);
    });
    it('non existing files', () => {
        const result = get_file_time_hash('non.txt');
        deepStrictEqual(result, undefined);
    });
    it('existing files', () => {
        const file_path = join(path, 'test.txt');
        const result = get_file_time_hash(file_path);
        deepStrictEqual(result.length >= 15, true);
        deepStrictEqual(result.length < 20, true);
    });
});
