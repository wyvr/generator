import { deepStrictEqual } from 'node:assert';
import { readFileSync } from 'node:fs';
import { describe, it } from 'mocha';
import { join } from 'node:path';
import { Cwd } from '../../../src/vars/cwd.js';
import { parse_content } from '../../../src/utils/dependency.js';

describe('utils/dependency/parse_content', () => {
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
        deepStrictEqual(parse_content(), undefined);
    });
    it('only content', async () => {
        deepStrictEqual(parse_content('a'), undefined);
    });
    it('only file', async () => {
        deepStrictEqual(parse_content(undefined, 'a'), undefined);
    });
    it('no dependencies', async () => {
        deepStrictEqual(parse_content('var a = 0;', './file.js'), {
            config: undefined,
            dependencies: [],
            i18n: {},
            rel_path: 'file.js',
        });
    });
    it('npm dependencies', async () => {
        deepStrictEqual(parse_content(`import a from 'axios';`, './file.js'), {
            config: undefined,
            dependencies: [],
            i18n: {},
            rel_path: 'file.js',
        });
    });
    it('already relative path', async () => {
        deepStrictEqual(parse_content('var a = 0;', 'src/file.js'), {
            config: undefined,
            dependencies: [],
            i18n: {},
            rel_path: 'src/file.js',
        });
    });
    it('single dependencies', async () => {
        deepStrictEqual(parse_content(`import a from './test';`, './file.js'), {
            config: undefined,
            dependencies: ['./test.js'],
            i18n: {},
            rel_path: 'file.js',
        });
    });
    it('multiple dependencies', async () => {
        deepStrictEqual(
            parse_content(
                `import a from './test';import a from './huhu';`,
                './file.js'
            ),
            {
                config: undefined,
                dependencies: ['./test.js', './huhu.js'],
                i18n: {},
                rel_path: 'file.js',
            }
        );
    });
    it('different types', async () => {
        deepStrictEqual(
            parse_content(
                `import a from './nonexisting';import ts from './ts';import js from './js';import mjs from './mjs';import cjs from './cjs';`,
                './file.js'
            ),
            {
                config: undefined,
                dependencies: ['./ts.ts', './js.js', './mjs.mjs', './cjs.cjs'],
                i18n: {},
                rel_path: 'file.js',
            }
        );
    });
    it('replace $src', async () => {
        deepStrictEqual(
            parse_content(`import a from '$src/svelte.svelte';`, './file.js'),
            {
                config: undefined,
                dependencies: ['src/svelte.svelte'],
                i18n: {},
                rel_path: 'file.js',
            }
        );
    });
    it('src in file path', async () => {
        deepStrictEqual(
            parse_content(
                `import a from '$src/svelte.svelte';`,
                'gen/src/file.js'
            ),
            {
                config: undefined,
                dependencies: ['src/svelte.svelte'],
                i18n: {},
                rel_path: 'src/file.js',
            }
        );
    });
    it('replace $src with absolute path', async () => {
        const file = join(Cwd.get(), 'file.js');
        const result = {
            config: undefined,
            dependencies: ['src/svelte.svelte'],
            i18n: {},
            rel_path: 'file.js',
        };
        deepStrictEqual(
            parse_content(`import a from '$src/svelte.svelte';`, file),
            result
        );
    });
    it('replace $src with found file in gen src', async () => {
        const file = join(Cwd.get(), 'file.js');
        const result = {
            config: undefined,
            dependencies: ['src/gen_src.svelte'],
            i18n: {},
            rel_path: 'file.js',
        };
        deepStrictEqual(
            parse_content(`import a from '$src/gen_src.svelte';`, file),
            result
        );
    });
    it('extract from plugin', async () => {
        const file = join('plugins', 'test.mjs');
        const file_path = join(Cwd.get(), 'gen', file);
        const result = {
            config: undefined,
            dependencies: ['src/test.mjs'],
            i18n: {},
            rel_path: file,
        };
        deepStrictEqual(
            parse_content(readFileSync(file_path, { encoding: 'utf-8' }), file),
            result
        );
    });
    it('extract from plugin with absolute paths', async () => {
        const file = join('plugins', 'test_abs.mjs');
        const file_path = join(Cwd.get(), 'gen', file);
        const result = {
            config: undefined,
            dependencies: ['src/test.mjs'],
            i18n: {},
            rel_path: file,
        };
        const content = readFileSync(file_path, { encoding: 'utf-8' }).replace(
            /\[cwd\]/g,
            Cwd.get()
        );
        deepStrictEqual(parse_content(content, file), result);
    });
    it('extract translations', async () => {
        deepStrictEqual(parse_content(`__('test')`, './file.js'), {
            config: undefined,
            dependencies: [],
            i18n: {},
            rel_path: 'file.js',
        });
    });
    describe('deprecated @src', () => {
        it('replace @src', async () => {
            deepStrictEqual(
                parse_content(
                    `import a from '@src/svelte.svelte';`,
                    './file.js'
                ),
                {
                    config: undefined,
                    dependencies: ['src/svelte.svelte'],
                    i18n: {},
                    rel_path: 'file.js',
                }
            );
        });
        it('src in file path', async () => {
            deepStrictEqual(
                parse_content(
                    `import a from '@src/svelte.svelte';`,
                    'gen/src/file.js'
                ),
                {
                    config: undefined,
                    dependencies: ['src/svelte.svelte'],
                    i18n: {},
                    rel_path: 'src/file.js',
                }
            );
        });
        it('replace @src with absolute path', async () => {
            const file = join(Cwd.get(), 'file.js');
            const result = {
                config: undefined,
                dependencies: ['src/svelte.svelte'],
                i18n: {},
                rel_path: 'file.js',
            };
            deepStrictEqual(
                parse_content(`import a from '@src/svelte.svelte';`, file),
                result
            );
        });
        it('replace @src with found file in gen src', async () => {
            const file = join(Cwd.get(), 'file.js');
            const result = {
                config: undefined,
                dependencies: ['src/gen_src.svelte'],
                i18n: {},
                rel_path: 'file.js',
            };
            deepStrictEqual(
                parse_content(`import a from '@src/gen_src.svelte';`, file),
                result
            );
        });
    });
});
