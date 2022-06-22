import { deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { join } from 'path';
import { dependencies_from_content } from '../../../src/utils/dependency.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/dependency/dependencies_from_content', () => {
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
        deepStrictEqual(dependencies_from_content(), undefined);
    });
    it('only content', async () => {
        deepStrictEqual(dependencies_from_content('a'), undefined);
    });
    it('only file', async () => {
        deepStrictEqual(dependencies_from_content(undefined, 'a'), undefined);
    });
    it('no dependencies', async () => {
        deepStrictEqual(dependencies_from_content(`var a = 0;`, 'file'), {});
    });
    it('single dependencies', async () => {
        deepStrictEqual(dependencies_from_content(`import a from './test';`, 'file'), { file: ['./test.js'] });
    });
    it('multiple dependencies', async () => {
        deepStrictEqual(dependencies_from_content(`import a from './test';import a from './huhu';`, 'file'), {
            file: ['./test.js', './huhu.js'],
        });
    });
    it('different types', async () => {
        deepStrictEqual(
            dependencies_from_content(
                `import a from './nonexisting';import ts from './ts';import js from './js';import mjs from './mjs';import cjs from './cjs';`,
                'file'
            ),
            { file: ['./ts.ts', './js.js', './mjs.mjs', './cjs.cjs'] }
        );
    });
});
