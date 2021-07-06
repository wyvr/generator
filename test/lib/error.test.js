const { join } = require('path');

require('module-alias/register');

describe('Lib/Error', () => {
    const assert = require('assert');
    const { Error } = require('@lib/error');
    const cwd = process.cwd();

    describe('extract', () => {
        it('structure', () => {
            const result = Error.extract(new SyntaxError('hi'));
            assert.deepStrictEqual(Object.keys(result), ['code', 'filename', 'hint', 'message', 'name', 'source', 'stack']);
        });
        it('JS error', () => {
            const error = {
                name: 'TypeError',
                message: 'The "path" argument must be of type string or an instance of Buffer or URL. Received null',
                stack: `TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be of type string or an instance of Buffer or URL. Received null
                    at Object.openSync (fs.js:453:10)
                    at Object.readFileSync (fs.js:364:35)
                    at ${cwd}/gen/plugins/wyvr/example/index.js:26:36
                    at Array.forEach (<anonymous>)
                    at Object.after [as fn] (${cwd}/gen/plugins/wyvr/example/index.js:25:19)
                    at Function.<anonymous> (${cwd}/wyvr/plugin.js:204:85)
                    at step (${cwd}/wyvr/plugin.js:33:23)
                    at Object.next (${cwd}/wyvr/plugin.js:14:53)
                    at ${cwd}/wyvr/plugin.js:8:71
                    at new Promise (<anonymous>)`,
            };
            assert.deepStrictEqual(Error.extract(error), {
                code: null,
                filename: null,
                hint: null,

                message: 'The "path" argument must be of type string or an instance of Buffer or URL. Received null',
                name: 'TypeError',
                source: null,
                stack: [`plugins/wyvr/example/index.js:26:36`],
            });
        });
        it('svelte error', () => {
            const error = {
                name: 'SyntaxError',
                message: 'Cannot use import statement outside a module',
                stack: `${cwd}/gen/src/test/store.js:1
                    import { writable } from 'svelte/store';
                    ^^^^^^
                    
                    SyntaxError: Cannot use import statement outside a module
                        at wrapSafe (internal/modules/cjs/loader.js:1116:16)
                        at Module._compile (internal/modules/cjs/loader.js:1164:27)
                        at Object.Module._extensions..js (internal/modules/cjs/loader.js:1220:10)
                        at Module.load (internal/modules/cjs/loader.js:1049:32)
                        at Function.Module._load (internal/modules/cjs/loader.js:937:14)
                        at Module.require (internal/modules/cjs/loader.js:1089:19)
                        at require (internal/modules/cjs/helpers.js:73:18)
                        at Object.<anonymous> (${cwd}/gen/src/test/StaticStore.svelte:5:19)
                        at Module._compile (internal/modules/cjs/loader.js:1200:30)
                        at Object.require.extensions.<computed> [as .svelte] (${cwd}/node_modules/svelte/register.js:49:17)`,
            };
            assert.deepStrictEqual(Error.extract(error), {
                code: null,
                filename: null,
                hint: `                    import { writable } from 'svelte/store';
                    ^^^^^^`,
                message: 'Cannot use import statement outside a module',
                name: 'SyntaxError',
                source: null,
                stack: [`src/test/store.js:1`],
            });
        });
        it('SASS error', () => {
            const error = {
                message: 'Undefined variable.',
                formatted:
                    'Error: Undefined variable.\n' +
                    '  ╷\n' +
                    '3 │ @mixin button($color: $primary) {\n' +
                    '  │                       ^^^^^^^^\n' +
                    '  ╵\n' +
                    '  gen/src/test/_test.scss 3:23  button()\n' +
                    '  stdin 8:9                     root stylesheet',
                line: 3,
                column: 23,
                file: '/Users/patrick/wyvr/generator/gen/src/test/_test.scss',
                status: 1,
            };
            assert.deepStrictEqual(Error.extract(error, join(cwd, 'gen', 'src')), {
                code: null,
                filename: '/Users/patrick/wyvr/generator/gen/src/test/_test.scss',
                hint: null,
                message: 'Undefined variable.',
                name: null,
                source: 'gen/src',
                stack: [
                    'Error: Undefined variable.',
                    '  ╷',
                    '3 │ @mixin button($color: $primary) {',
                    '  │                       ^^^^^^^^',
                    '  ╵',
                    '  gen/src/test/_test.scss 3:23  button()',
                    '  stdin 8:9                     root stylesheet',
                ],
            });
        });
        it('source', () => {
            const error = {
                name: 'SyntaxError',
                message: 'Cannot use import statement outside a module',
            };
            assert.deepStrictEqual(Error.extract(error, join(cwd, 'gen', 'src')), {
                code: null,
                filename: null,
                hint: null,
                message: 'Cannot use import statement outside a module',
                name: 'SyntaxError',
                source: 'gen/src',
                stack: null,
            });
        });
        it('stack', () => {
            const error = {
                name: 'SyntaxError',
                stack: `test
- ${cwd}/gen/src/test/minus
                at ${cwd}/gen/src/test/at`,
            };
            assert.deepStrictEqual(Error.extract(error), {
                code: null,
                filename: null,
                hint: null,
                message: null,
                name: 'SyntaxError',
                source: null,
                stack: ['src/test/minus', 'src/test/at'],
            });
        });
        it('RangeError', () => {
            let error = null;
            try {
                let list = Array(Number.MAX_VALUE);
            } catch (e) {
                error = Error.extract(e);
            }

            assert.deepStrictEqual(error, {
                code: null,
                filename: null,
                hint: null,
                message: 'Invalid array length',
                name: 'RangeError',
                source: null,
                stack: [],
            });
        });
        it('ReferenceError', () => {
            let error = null;
            try {
                var a = a + b;
            } catch (e) {
                error = Error.extract(e);
            }

            assert.deepStrictEqual(error, {
                code: null,
                filename: null,
                hint: null,
                message: 'b is not defined',
                name: 'ReferenceError',
                source: null,
                stack: [],
            });
        });
        it('SyntaxError', () => {
            let error = null;
            try {
                eval('a x b');
            } catch (e) {
                error = Error.extract(e);
            }

            assert.deepStrictEqual(error, {
                code: null,
                filename: null,
                hint: null,
                message: 'Unexpected identifier',
                name: 'SyntaxError',
                source: null,
                stack: [],
            });
        });
        it('TypeError', () => {
            let error = null;
            try {
                let x = new 'String'();
            } catch (e) {
                error = Error.extract(e);
            }

            assert.deepStrictEqual(error, {
                code: null,
                filename: null,
                hint: null,
                message: '"String" is not a constructor',
                name: 'TypeError',
                source: null,
                stack: [],
            });
        });
        it('URIError', () => {
            let error = null;
            try {
                decodeURI('%');
            } catch (e) {
                error = Error.extract(e);
            }

            assert.deepStrictEqual(error, {
                code: null,
                filename: null,
                hint: null,
                message: 'URI malformed',
                name: 'URIError',
                source: null,
                stack: [],
            });
        });
        it('Maximum call stack size exceeded', () => {
            let error = null;
            try {
                function foo() {
                    foo();
                }
                foo();
            } catch (e) {
                error = Error.extract(e);
            }

            assert.deepStrictEqual(error, {
                code: null,
                filename: null,
                hint: null,
                message: 'Maximum call stack size exceeded',
                name: 'RangeError',
                source: null,
                stack: [],
            });
        });
    });
    describe('get', () => {
        it('output', () => {
            const error = {
                name: 'SyntaxError',
                message: 'Cannot use import statement outside a module',
                stack: `test
        - ${cwd}/gen/src/test/minus
                at ${cwd}/gen/src/test/at`,
            };
            assert.deepStrictEqual(
                Error.get(error),
                `[\x1B[1mSyntaxError\x1B[22m] Cannot use import statement outside a module
\x1B[2mstack\x1B[22m
\x1B[2m-\x1B[22m src/test/at`
            );
        });
        it('scoping', () => {
            const error = {
                name: 'SyntaxError',
                stack: `test
        - ${cwd}/gen/src/test/minus
                at ${cwd}/gen/src/test/at`,
            };
            assert.deepStrictEqual(
                Error.get(error, 'file', 'test'),
                `\x1B[1m@test\x1B[22m
[\x1B[1mSyntaxError\x1B[22m] -
\x1B[2mstack\x1B[22m
\x1B[2m-\x1B[22m src/test/at
\x1B[2msource\x1B[22m file`
            );
        });
        it('minimal', () => {
            const error = {};
            assert.deepStrictEqual(Error.get(error, null, 'test'), `\x1B[1m@test\x1B[22m\n[] -`);
        });
    });
});
