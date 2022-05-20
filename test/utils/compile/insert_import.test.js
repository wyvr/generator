import { deepStrictEqual, strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { insert_import } from '../../../src/utils/compile.js';
import { to_plain } from '../../../src/utils/to.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/to/insert_import', () => {
    let log = [];
    let console_error;
    const __dirname = join(dirname(resolve(join(fileURLToPath(import.meta.url)))), '..', 'transform','_tests', 'combine_splits');
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
        strictEqual(await insert_import(), '');
    });
    it('no import found', async () => {
        strictEqual(
            await insert_import('code {\n        display: block;\n    }', 'testfile.scss'),
            'code {\n        display: block;\n    }'
        );
    });
    it('import absolute path', async () => {
        strictEqual(
            await insert_import(
                `@import '${process.cwd()}/test/utils/transform/_tests/combine_splits/gen/src/_test.scss';\n\n    code {\n        display: block;\n    }\n    button {\n        @include button();\n    }\n`
            ),
            `a {
    color: red;
}


$primary-color: #7c5ed0;

@mixin button($color: $primary-color) {
    border: 2px solid $color;
    background: transparent;
    padding: 10px;
    font-size: 16px;
    color: $color;
}\n\n\n    code {\n        display: block;\n    }\n    button {\n        @include button();\n    }\n`
        );
        deepStrictEqual(log, []);
    });
    it('non existing file', async () => {
        strictEqual(
            await insert_import(
                `@import '${process.cwd()}/nonexisting';\n\n    code {\n        display: block;\n    }`
            ),
            '\n\n    code {\n        display: block;\n    }'
        );
        deepStrictEqual(log, [
            [
                '⚠',
                '@import\n' +
                    "[] can not import /home/p/wyvr/generator/_nonexisting.scss into undefined, maybe the file doesn't exist\n" +
                    'stack',
            ],
        ]);
    });
});
