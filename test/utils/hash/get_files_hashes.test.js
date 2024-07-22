import { deepStrictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { join } from 'node:path';
import { get_files_hashes } from '../../../src/utils/hash.js';
import { Cwd } from '../../../src/vars/cwd.js';
import { ReleasePath } from '../../../src/vars/release_path.js';

describe('utils/hash/get_files_hashes', () => {
    const path = join(process.cwd(), 'test', 'utils', 'hash', '_tests');

    before(async () => {
        Cwd.set(path);
        ReleasePath.set(path);
    });
    beforeEach(() => {});
    afterEach(() => {});
    after(() => {
        Cwd.set(undefined);
        ReleasePath.set(undefined);
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
        const rel_path = '/test.txt';
        const file_path = join(path, rel_path);
        const result = get_files_hashes([file_path]);
        const test = {};
        test[rel_path] = {
            hash: '0f24276d1f0a0154',
            path: rel_path.replace('.txt', '_0f24276d1f0a0154.txt'),
            rel_path,
        };
        deepStrictEqual(result, test);
    });
    it('existing file in js/src folder', () => {
        const rel_path = '/js/src/test/test.js';
        const file_path = join(path, rel_path);
        const result = get_files_hashes([file_path]);
        const test = {};
        test[rel_path] = {
            hash: '90d776e518e46065',
            path: rel_path.replace('.js', '_90d776e518e46065.js'),
            rel_path,
        };
        deepStrictEqual(result, test);
    });
});
