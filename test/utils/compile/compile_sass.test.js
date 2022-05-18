import { deepStrictEqual, strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { compile_sass } from '../../../src/utils/compile.js';
import { to_plain } from '../../../src/utils/to.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/to/compile_sass', () => {
    let log = [];
    let console_error;
    beforeEach(()=>{
        Cwd.set(process.cwd());
        console_error = console.error;
        console.error = (...values) => {
            log.push(values.map(to_plain));
        };
    })
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
