import { deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { join } from 'path';
import { get_dependencies } from '../../../src/utils/dependency.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/dependency/get_dependencies', () => {
    const path = join(process.cwd(), 'test', 'utils', 'dependency', '_tests');

    before(async () => {
        Cwd.set(path);
    });
    beforeEach(() => {});
    afterEach(() => {});
    after(() => {
        Cwd.set(undefined);
    });
    it('undefined', async () => {
        deepStrictEqual(get_dependencies(), []);
    });
    it('empty tree', async () => {
        deepStrictEqual(get_dependencies({}), []);
    });
    it('empty file', async () => {
        deepStrictEqual(get_dependencies({ 'file1.js': ['file2.js'], 'file2.js': ['file3.js'] }), []);
    });
    it('get dependencies', async () => {
        deepStrictEqual(
            get_dependencies(
                { 'file1.js': ['file2.js', 'file4.js'], 'file2.js': ['file3.js'], 'file4.js': ['file3.js'] },
                'file1.js'
            ),
            ['file2.js', 'file4.js', 'file3.js']
        );
    });
});
