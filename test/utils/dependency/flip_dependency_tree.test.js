import { deepStrictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { join } from 'node:path';
import { flip_dependency_tree } from '../../../src/utils/dependency.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/dependency/flip_dependency_tree', () => {
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
        deepStrictEqual(flip_dependency_tree(), undefined);
    });
    it('empty', async () => {
        deepStrictEqual(flip_dependency_tree({}), undefined);
    });
    it('simple', async () => {
        deepStrictEqual(flip_dependency_tree({ './file.js': ['./ts.ts', './js.js'] }), {
            './ts.ts': ['./file.js'],
            './js.js': ['./file.js'],
        });
    });
    it('complex', async () => {
        deepStrictEqual(flip_dependency_tree({ './file.js': ['./ts.ts', './js.js'], './file1.js': ['./js.js'] }), {
            './ts.ts': ['./file.js'],
            './js.js': ['./file.js', './file1.js'],
        });
    });
});
