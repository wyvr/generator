const { join } = require('path');

require('module-alias/register');

describe('Lib/Error', () => {
    const assert = require('assert');
    const { Error } = require('@lib/error');
    const cwd = process.cwd();

    describe('extract', () => {
        it('structure', () => {
            const result = Error.extract(new SyntaxError('hi'));
            assert.deepStrictEqual(Object.keys(result), ['code', 'filename', 'hint', 'message', 'name', 'source', 'stack', 'debug']);
        });
        it('JS error', () => {
            const e = {
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
            const error = Error.extract(e);
            assert.strictEqual(error.code, null);
            assert.strictEqual(error.filename, null);
            assert.strictEqual(error.hint, null);
            assert.strictEqual(error.message, 'The "path" argument must be of type string or an instance of Buffer or URL. Received null');
            assert.strictEqual(error.name, 'TypeError');
            assert.strictEqual(error.source, null);
            assert.deepStrictEqual(error.stack, ['plugins/wyvr/example/index.js:26:36', 'Object.after [as fn] (plugins/wyvr/example/index.js:25:19)']);
            assert(error.debug != null);
        });
        it('svelte error', () => {
            const e = {
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
            const error = Error.extract(e);
            assert.strictEqual(error.code, null);
            assert.strictEqual(error.filename, null);
            assert.strictEqual(
                error.hint,
                `                    import { writable } from 'svelte/store';
                    ^^^^^^`
            );
            assert.strictEqual(error.message, 'Cannot use import statement outside a module');
            assert.strictEqual(error.name, 'SyntaxError');
            assert.strictEqual(error.source, null);
            assert.deepStrictEqual(error.stack, [`src/test/store.js:1`]);
            assert(error.debug != null);
        });
        it('SASS error', () => {
            const e = {
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
            const error = Error.extract(e, join(cwd, 'gen', 'src'));
            assert.strictEqual(error.code, null);
            assert.strictEqual(error.filename, '/Users/patrick/wyvr/generator/gen/src/test/_test.scss');
            assert.strictEqual(error.hint, null);
            assert.strictEqual(error.message, 'Undefined variable.');
            assert.strictEqual(error.name, null);
            assert.strictEqual(error.source, 'gen/src');
            assert.deepStrictEqual(error.stack, [
                'Error: Undefined variable.',
                '  ╷',
                '3 │ @mixin button($color: $primary) {',
                '  │                       ^^^^^^^^',
                '  ╵',
                '  gen/src/test/_test.scss 3:23  button()',
                '  stdin 8:9                     root stylesheet',
            ]);
            assert(error.debug == null);
        });
        it('source', () => {
            const e = {
                name: 'SyntaxError',
                message: 'Cannot use import statement outside a module',
            };
            const error = Error.extract(e, join(cwd, 'gen', 'src'));

            assert.strictEqual(error.code, null);
            assert.strictEqual(error.filename, null);
            assert.strictEqual(error.hint, null);
            assert.strictEqual(error.message, 'Cannot use import statement outside a module');
            assert.strictEqual(error.name, 'SyntaxError');
            assert.strictEqual(error.source, 'gen/src');
            assert.deepStrictEqual(error.stack, []);
            assert(error.debug == null);
        });
        it('stack', () => {
            const e = {
                name: 'SyntaxError',
                stack: `test
- ${cwd}/gen/src/test/minus
                at ${cwd}/gen/src/test/at`,
            };
            const error = Error.extract(e);

            assert.strictEqual(error.code, null);
            assert.strictEqual(error.filename, null);
            assert.strictEqual(error.hint, null);
            assert.strictEqual(error.message, null);
            assert.strictEqual(error.name, 'SyntaxError');
            assert.strictEqual(error.source, null);
            assert.deepStrictEqual(error.stack, ['src/test/minus', 'src/test/at']);
            assert(error.debug != null);
        });
        it('RangeError', () => {
            let error = null;
            try {
                let list = Array(Number.MAX_VALUE);
            } catch (e) {
                error = Error.extract(e);
            }

            assert.strictEqual(error.code, null);
            assert.strictEqual(error.filename, null);
            assert.strictEqual(error.hint, null);
            assert.strictEqual(error.message, 'Invalid array length');
            assert.strictEqual(error.name, 'RangeError');
            assert.strictEqual(error.source, null);
            assert.deepStrictEqual(error.stack, []);
            assert(error.debug != null);
        });
        it('ReferenceError', () => {
            let error = null;
            try {
                var a = a + b;
            } catch (e) {
                error = Error.extract(e);
            }

            assert.strictEqual(error.code, null);
            assert.strictEqual(error.filename, null);
            assert.strictEqual(error.hint, null);
            assert.strictEqual(error.message, 'b is not defined');
            assert.strictEqual(error.name, 'ReferenceError');
            assert.strictEqual(error.source, null);
            assert.deepStrictEqual(error.stack, []);
            assert(error.debug != null);
        });
        it('SyntaxError', () => {
            let error = null;
            try {
                eval('a x b');
            } catch (e) {
                error = Error.extract(e);
            }

            assert.strictEqual(error.code, null);
            assert.strictEqual(error.filename, null);
            assert.strictEqual(error.hint, null);
            assert.strictEqual(error.message, 'Unexpected identifier');
            assert.strictEqual(error.name, 'SyntaxError');
            assert.strictEqual(error.source, null);
            assert.deepStrictEqual(error.stack, []);
            assert(error.debug != null);
        });
        it('TypeError', () => {
            let error = null;
            try {
                let x = new 'String'();
            } catch (e) {
                error = Error.extract(e);
            }
            assert.strictEqual(error.code, null);
            assert.strictEqual(error.filename, null);
            assert.strictEqual(error.hint, null);
            assert.strictEqual(error.message, '"String" is not a constructor');
            assert.strictEqual(error.name, 'TypeError');
            assert.strictEqual(error.source, null);
            assert.deepStrictEqual(error.stack, []);
            assert(error.debug != null);
        });
        it('URIError', () => {
            let error = null;
            try {
                decodeURI('%');
            } catch (e) {
                error = Error.extract(e);
            }
            assert.strictEqual(error.code, null);
            assert.strictEqual(error.filename, null);
            assert.strictEqual(error.hint, null);
            assert.strictEqual(error.message, 'URI malformed');
            assert.strictEqual(error.name, 'URIError');
            assert.strictEqual(error.source, null);
            assert.deepStrictEqual(error.stack, []);
            assert(error.debug != null);
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
            assert.strictEqual(error.code, null);
            assert.strictEqual(error.filename, null);
            assert.strictEqual(error.hint, null);
            assert.strictEqual(error.message, 'Maximum call stack size exceeded');
            assert.strictEqual(error.name, 'RangeError');
            assert.strictEqual(error.source, null);
            assert.deepStrictEqual(error.stack, []);
            assert(error.debug != null);
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
            assert.deepStrictEqual(Error.get(error, null, 'test'), `\x1B[1m@test\x1B[22m\n[] -\n\x1B[2mstack\x1B[22m`);
        });
    });
});
