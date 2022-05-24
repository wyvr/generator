import { deepStrictEqual, strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { join } from 'path';
import { compile_markdown } from '../../../src/utils/compile.js';
import { read, write } from '../../../src/utils/file.js';
import { to_dirname, to_plain } from '../../../src/utils/to.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/to/compile_markdown', () => {
    let log = [];
    let console_error;
    const cwd = process.cwd();
    const __dirname = join(
        to_dirname(import.meta.url),
        '..',
        'compile',
        '_tests',
        'markdown'
    );
    beforeEach(() => {
        Cwd.set(__dirname);
        console_error = console.error;
        console.error = (...values) => {
            log.push(values.map(to_plain));
        };
    });
    afterEach(() => {
        log = [];
        console_error = console.error;
        Cwd.set(undefined);
    });

    it('undefined', async () => {
        strictEqual(await compile_markdown(), undefined);
        deepStrictEqual(log, []);
    });
    it('valid code', async () => {
        const content = read(join(__dirname, 'full.md'));
        const result = read(join(__dirname, 'full_compiled.md'));
        const output = await compile_markdown(content);

        strictEqual(output, result);
        deepStrictEqual(log, []);
    });
});
