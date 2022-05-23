import { deepStrictEqual, strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { compile_sass } from '../../../src/utils/compile.js';
import { to_plain } from '../../../src/utils/to.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/to/compile_sass', () => {
    let log = [];
    let console_error;
    const cwd = process.cwd();
    const __dirname = join(
        dirname(resolve(join(fileURLToPath(import.meta.url)))),
        '..',
        'transform',
        '_tests',
        'combine_splits'
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
        strictEqual(await compile_sass(), undefined);
    });
    it('valid code', async () => {
        strictEqual(
            await compile_sass('$color:red;.a {color:$color;}', 'testfile.scss'),
            `.a {
  color: red;
}`
        );
    });
    it('error with filename', async () => {
        strictEqual(await compile_sass('.a {color:$color;}', 'testfile.scss'), undefined);
        deepStrictEqual(log, [
            [
                '✖',
                '@sass\n' +
                    '[Error] Undefined variable.\n' +
                    'stack\n' +
                    '-   ╷\n' +
                    '- 1 │ .a {color:$color;}\n' +
                    '-   │           ^^^^^^\n' +
                    '-   ╵\n' +
                    'source testfile.scss',
            ],
        ]);
    });
    it('import absolute path', async () => {
        strictEqual(
            await compile_sass(
                "\n    @import '" +
                    cwd +
                    "/test/utils/transform/_tests/combine_splits/gen/src/_test.scss';\n\n    code {\n        display: block;\n    }\n    button {\n        @include button();\n    }\n"
            ),
            'a {\n' +
                '  color: red;\n' +
                '}\n' +
                '\n' +
                'code {\n' +
                '  display: block;\n' +
                '}\n' +
                '\n' +
                'button {\n' +
                '  border: 2px solid #7c5ed0;\n' +
                '  background: transparent;\n' +
                '  padding: 10px;\n' +
                '  font-size: 16px;\n' +
                '  color: #7c5ed0;\n' +
                '}'
        );
        deepStrictEqual(log, []);
    });
    it('import empty file', async () => {
        strictEqual(
            await compile_sass(
                "@import '" +
                    cwd +
                    "/test/utils/transform/_tests/combine_splits/gen/src/_empty.scss';.a { color: red; }"
            ),
            '.a {\n' + '  color: red;\n' + '}'
        );
        deepStrictEqual(log, []);
    });
    it('error without filename', async () => {
        strictEqual(await compile_sass('.a {color:$color;}'), undefined);
        deepStrictEqual(log, [
            [
                '✖',
                '@sass\n' +
                    '[Error] Undefined variable.\n' +
                    'stack\n' +
                    '-   ╷\n' +
                    '- 1 │ .a {color:$color;}\n' +
                    '-   │           ^^^^^^\n' +
                    '-   ╵',
            ],
        ]);
    });
});
