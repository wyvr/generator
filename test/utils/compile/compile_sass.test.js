import { deepStrictEqual, strictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { join } from 'node:path';
import { compile_sass } from '../../../src/utils/compile.js';
import { to_dirname, to_plain } from '../../../src/utils/to.js';
import { Cwd } from '../../../src/vars/cwd.js';
import Sinon from 'sinon';

describe('utils/to/compile_sass', () => {
    let log = [];
    let console_error;
    const cwd = process.cwd();
    const __dirname = join(
        to_dirname(import.meta.url),
        '..',
        'transform',
        '_tests',
        'combine_splits'
    );
    before(() => {
        Sinon.stub(console, 'log');
        console.log.callsFake((...msg) => {
            log.push(msg.map(to_plain));
        });
    });
    beforeEach(() => {
        Cwd.set(__dirname);
    });
    afterEach(() => {
        log = [];
        Cwd.set(undefined);
    });
    after(() => {
        console.log.restore();
    });

    it('undefined', async () => {
        strictEqual(await compile_sass(), undefined);
    });
    it('valid code', async () => {
        strictEqual(
            await compile_sass(
                '$color:red;.a {color:$color;}',
                'testfile.scss'
            ),
            `.a {
  color: red;
}`
        );
    });
    it('error with filename', async () => {
        strictEqual(
            await compile_sass('.a {color:$color;}', 'testfile.scss'),
            undefined
        );
        deepStrictEqual(log, [
            [
                '✖',
                '@sass\n[Error] Undefined variable.\n  ╷\n1 │ .a {color:$color;}\n  │           ^^^^^^\n  ╵\n  - 1:11  root stylesheet\nstack\n-   ╷\n- 1 │ .a {color:$color;}\n-   │           ^^^^^^\n-   ╵\nsource testfile.scss',
            ],
        ]);
    });
    it('import absolute path', async () => {
        strictEqual(
            await compile_sass(
                `\n    @import '${cwd}/test/utils/transform/_tests/combine_splits/gen/src/_test.scss';\n\n    code {\n        display: block;\n    }\n    button {\n        @include button();\n    }\n`
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
                `@import '${cwd}/test/utils/transform/_tests/combine_splits/gen/src/_empty.scss';.a { color: red; }`
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
                '@sass\n[Error] Undefined variable.\n  ╷\n1 │ .a {color:$color;}\n  │           ^^^^^^\n  ╵\n  - 1:11  root stylesheet\nstack\n-   ╷\n- 1 │ .a {color:$color;}\n-   │           ^^^^^^\n-   ╵',
            ],
        ]);
    });
});
