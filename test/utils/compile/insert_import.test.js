import { deepStrictEqual, strictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { join } from 'node:path';
import { insert_import } from '../../../src/utils/compile.js';
import { to_dirname, to_plain } from '../../../src/utils/to.js';
import { Cwd } from '../../../src/vars/cwd.js';
import Sinon from 'sinon';

describe('utils/to/insert_import', () => {
    let log = [];
    const __dirname = join(
        to_dirname(import.meta.url),
        '..',
        'transform',
        '_tests',
        'combine_splits'
    );
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
        strictEqual(await insert_import(), '');
    });
    it('no import found', async () => {
        strictEqual(
            await insert_import(
                'code {\n        display: block;\n    }',
                'testfile.scss'
            ),
            'code {\n        display: block;\n    }'
        );
    });
    it('import absolute path', async () => {
        strictEqual(
            await insert_import(
                `@import '$src/_test.scss';\n\n    code {\n        display: block;\n    }\n    button {\n        @include button();\n    }\n`
            ),
            'a {     color: red; }   $primary-color: #7c5ed0;  @mixin button($color: $primary-color) {     border: 2px solid $color;     background: transparent;     padding: 10px;     font-size: 16px;     color: $color; } \n\n    code {\n        display: block;\n    }\n    button {\n        @include button();\n    }\n'
        );
        deepStrictEqual(log, []);
    });
    it('non existing file', async () => {
        strictEqual(
            await insert_import(
                `@import '$src/nonexisting';\n\n    code {\n        display: block;\n    }`
            ),
            '\n\n    code {\n        display: block;\n    }'
        );
        deepStrictEqual(log, [
            [
                '⚠',
                `@import\n[] can not import ${__dirname}/gen/src/_nonexisting.scss into undefined, maybe the file doesn't exist`,
            ],
        ]);
    });
    describe('deprecated @src', () => {
        it('import absolute path', async () => {
            strictEqual(
                await insert_import(
                    `@import '@src/_test.scss';\n\n    code {\n        display: block;\n    }\n    button {\n        @include button();\n    }\n`
                ),
                `a {     color: red; }   $primary-color: #7c5ed0;  @mixin button($color: $primary-color) {     border: 2px solid $color;     background: transparent;     padding: 10px;     font-size: 16px;     color: $color; } \n\n    code {\n        display: block;\n    }\n    button {\n        @include button();\n    }\n`
            );
            deepStrictEqual(log, []);
        });
        it('non existing file', async () => {
            strictEqual(
                await insert_import(
                    `@import '@src/nonexisting';\n\n    code {\n        display: block;\n    }`
                ),
                '\n\n    code {\n        display: block;\n    }'
            );
            deepStrictEqual(log, [
                [
                    '⚠',
                    '@import\n' +
                        `[] can not import ${__dirname}/gen/src/_nonexisting.scss into undefined, maybe the file doesn't exist`,
                ],
            ]);
        });
    });
});
