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
        deepStrictEqual(dependencies_from_content(`var a = 0;`, './file.js'), { dependencies: undefined, i18n: {} });
    });
    it('npm dependencies', async () => {
        deepStrictEqual(dependencies_from_content(`import a from 'axios';`, './file.js'), {
            dependencies: undefined,
            i18n: {},
        });
    });
    it('single dependencies', async () => {
        deepStrictEqual(dependencies_from_content(`import a from './test';`, './file.js'), {
            dependencies: {
                './file.js': ['./test.js'],
            },
            i18n: {},
        });
    });
    it('multiple dependencies', async () => {
        deepStrictEqual(dependencies_from_content(`import a from './test';import a from './huhu';`, './file.js'), {
            dependencies: {
                './file.js': ['./test.js', './huhu.js'],
            },
            i18n: {},
        });
    });
    
    it('different types', async () => {
        deepStrictEqual(
            dependencies_from_content(
                `import a from './nonexisting';import ts from './ts';import js from './js';import mjs from './mjs';import cjs from './cjs';`,
                './file.js'
            ),
            {
                dependencies: { './file.js': ['./ts.ts', './js.js', './mjs.mjs', './cjs.cjs'] },
                i18n: {},
            }
        );
    });
    it('replace @src', async () => {
        deepStrictEqual(dependencies_from_content(`import a from '@src/svelte.svelte';`, './file.js'), {
            dependencies: {
                './file.js': ['src/svelte.svelte'],
            },
            i18n: {},
        });
    });
    it('src in file path', async () => {
        deepStrictEqual(dependencies_from_content(`import a from '@src/svelte.svelte';`, 'gen/src/file.js'), {
            dependencies: {
                'src/file.js': ['src/svelte.svelte'],
            },
            i18n: {},
        });
    });
    it('replace @src with absolute path', async () => {
        const file = join(Cwd.get(), 'file.js');
        const result = { dependencies: {}, i18n: {} };
        result.dependencies[file] = ['src/svelte.svelte'];
        deepStrictEqual(dependencies_from_content(`import a from '@src/svelte.svelte';`, file), result);
    });
    it('replace @src with found file in gen src', async () => {
        const file = join(Cwd.get(), 'file.js');
        const result = { dependencies: {}, i18n: {} };
        result.dependencies[file] = ['src/gen_src.svelte'];
        deepStrictEqual(dependencies_from_content(`import a from '@src/gen_src.svelte';`, file), result);
    });
    it('extract translations', async () => {
        deepStrictEqual(dependencies_from_content(`__('test')`, './file.js'), {
            dependencies: undefined,
            i18n: {
                './file.js': ['test'],
            },
        });
    });
});
