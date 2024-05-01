import { deepStrictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { join } from 'node:path';
import { get_files_hashes } from '../../../src/utils/hash.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/hash/get_files_hashes', () => {
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
        const result = get_files_hashes();
        deepStrictEqual(result, {});
    });
    it('empty', () => {
        const result = get_files_hashes([]);
        deepStrictEqual(result, {});
    });
    it('non existing files', () => {
        const result = get_files_hashes(['non.txt']);
        deepStrictEqual(result, {});
    });
    it('existing files', () => {
        const file_path = join(path, 'test.txt');
        const result = get_files_hashes([file_path]);
        const test = {};
        test[file_path] = {
            hash: '0f24276d1f0a0154',
            path: file_path.replace('.txt', '_0f24276d1f0a0154.txt'),
            rel_path: file_path,
        };
        deepStrictEqual(result, test);
    });
});
