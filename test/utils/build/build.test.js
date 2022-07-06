import { deepStrictEqual, strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { join } from 'path';
import { EnvType } from '../../../src/struc/env.js';
import { build } from '../../../src/utils/build.js';
import { read, write } from '../../../src/utils/file.js';
import { to_dirname, to_plain } from '../../../src/utils/to.js';
import { Cwd } from '../../../src/vars/cwd.js';
import { Env } from '../../../src/vars/env.js';

describe('utils/build/build', () => {
    let log = [];
    let console_log;
    let console_warn;
    let console_error;
    const __dirname = join(to_dirname(import.meta.url), '_tests');
    before(() => {
        Cwd.set(__dirname);
        Env.set(EnvType.dev);
        console_log = console.error;
        console.log = (...values) => {
            log.push(values.map(to_plain));
        };
        console_warn = console.warn;
        console.warn = (...values) => {
            log.push(values.map(to_plain));
        };
        console_error = console.error;
        console.error = (...values) => {
            log.push(values.map(to_plain));
        };
    });
    afterEach(() => {
        log = [];
    });
    after(() => {
        log = [];
        console.error = console_error;
        console.warn = console_warn;
        console.log = console_log;
        Cwd.set(undefined);
        Env.set(EnvType.prod);
    });

    it('undefined', async () => {
        deepStrictEqual(await build(), { code: undefined, sourcemap: undefined });
    });
    it('single file with warnings and supressed warnings', async () => {
        const content = read(join(__dirname, 'single.js'))
            .replace(/\[cwd\]/g, __dirname)
            .replace(/\[root\]/g, process.cwd());
        const result = await build(content, 'single.js');
        strictEqual(
            result.code.indexOf('document.querySelectorAll(\'[data-hydrate="file"]\')') > -1,
            true,
            'contains selector'
        );
        strictEqual(result.code.indexOf('@import') == -1, true, 'should not contain @import');
        deepStrictEqual(log, [
            [
                '⚠',
                '@svelte\n' +
                    '[] Unused CSS selector "a"\n' +
                    'stack\n' +
                    '- 13:         border: 1px solid red;\n' +
                    '- 14:     }\n' +
                    '- 15:     a {\n' +
                    '-         ^\n' +
                    '- 16:         color: blue;\n' +
                    '- 17:     }\n' +
                    'source single.js',
            ],
        ]);
    });
    it('non existing file', async () => {
        const result = await build(undefined, 'nonexisting.js');
        deepStrictEqual(result, { code: undefined, sourcemap: undefined });
        deepStrictEqual(log, []);
    });
    it('non existing import', async () => {
        const content = read(join(__dirname, 'nonexisting_import.js'))
            .replace(/\[cwd\]/g, __dirname)
            .replace(/\[root\]/g, process.cwd());
        const result = await build(content, 'error.js');
        deepStrictEqual(result, { code: undefined, sourcemap: undefined });
        deepStrictEqual(log, [
            [
                '✖',
                '@build\n' +
                    '[Error] - Could not resolve "' +
                    __dirname +
                    '/gen/client/Nonexisting.svelte" 130:17\n' +
                    'source error.js',
            ],
        ]);
    });
    it('throw error', async () => {
        const content = read(join(__dirname, 'error.js'))
            .replace(/\[cwd\]/g, __dirname)
            .replace(/\[root\]/g, process.cwd());
        const result = await build(content, 'error.js');
        strictEqual(result.code, undefined);
        deepStrictEqual(log, [
            ['✖', '@build\n' + '[Error] - Cannot assign to "a" because it is a constant 2:0\n' + 'source error.js'],
        ]);
    });
});
