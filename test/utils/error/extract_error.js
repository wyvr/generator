import { deepStrictEqual, strictEqual, ok } from 'assert';
import { describe, it } from 'mocha';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { extract_error } from '../../../src/utils/error.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/error/extract_error', () => {
    const __dirname = dirname(resolve(join(fileURLToPath(import.meta.url))));
    const cwd = Cwd.get();

    beforeEach(() => {
        Cwd.set(__dirname);
    });
    afterEach(() => {
        Cwd.set(cwd);
    });

    it('structure', () => {
        const result = extract_error(new SyntaxError('hi'));
        deepStrictEqual(Object.keys(result), [
            'code',
            'filename',
            'hint',
            'message',
            'name',
            'source',
            'stack',
            'debug',
        ]);
    });

    it('JS error', () => {
        const e = {
            name: 'TypeError',
            message: 'The "path" argument must be of type string or an instance of Buffer or URL. Received null',
            stack: `TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be of type string or an instance of Buffer or URL. Received null
                            at Object.openSync (fs.js:453:10)
                            at Object.readFileSync (fs.js:364:35)
                            at ${__dirname}/gen/plugins/wyvr/example/index.js:26:36
                            at Array.forEach (<anonymous>)
                            at Object.after [as fn] (${__dirname}/gen/plugins/wyvr/example/index.js:25:19)
                            at Function.<anonymous> (${__dirname}/wyvr/plugin.js:204:85)
                            at step (${__dirname}/wyvr/plugin.js:33:23)
                            at Object.next (${__dirname}/wyvr/plugin.js:14:53)
                            at ${__dirname}/wyvr/plugin.js:8:71
                            at new Promise (<anonymous>)`,
        };
        const error = extract_error(e);
        strictEqual(error.code, undefined);
        strictEqual(error.filename, undefined);
        strictEqual(error.hint, undefined);
        strictEqual(
            error.message,
            'The "path" argument must be of type string or an instance of Buffer or URL. Received null'
        );
        strictEqual(error.name, 'TypeError');
        strictEqual(error.source, undefined);
        deepStrictEqual(error.stack, [
            'plugins/wyvr/example/index.js:26:36',
            'Object.after [as fn] (plugins/wyvr/example/index.js:25:19)',
        ]);
        ok(error.debug != undefined);
    });
    it('svelte error', () => {
        const e = {
            name: 'SyntaxError',
            message: 'Cannot use import statement outside a module',
            stack: `${__dirname}/gen/src/test/store.js:1
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
                                at Object.<anonymous> (${__dirname}/gen/src/test/StaticStore.svelte:5:19)
                                at Module._compile (internal/modules/cjs/loader.js:1200:30)
                                at Object.require.extensions.<computed> [as .svelte] (${__dirname}/node_modules/svelte/register.js:49:17)`,
        };
        const error = extract_error(e);
        strictEqual(error.code, undefined);
        strictEqual(error.filename, undefined);
        strictEqual(
            error.hint,
            `                    import { writable } from 'svelte/store';
                            ^^^^^^`
        );
        strictEqual(error.message, 'Cannot use import statement outside a module');
        strictEqual(error.name, 'SyntaxError');
        strictEqual(error.source, undefined);
        deepStrictEqual(error.stack, [`src/test/store.js:1`]);
        ok(error.debug != undefined);
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
        const error = extract_error(e, join(__dirname, 'gen', 'src'));
        strictEqual(error.code, undefined);
        strictEqual(error.filename, '/Users/patrick/wyvr/generator/gen/src/test/_test.scss');
        strictEqual(error.hint, undefined);
        strictEqual(error.message, 'Undefined variable.');
        strictEqual(error.name, undefined);
        strictEqual(error.source, 'gen/src');
        deepStrictEqual(error.stack, [
            'Error: Undefined variable.',
            '  ╷',
            '3 │ @mixin button($color: $primary) {',
            '  │                       ^^^^^^^^',
            '  ╵',
            '  gen/src/test/_test.scss 3:23  button()',
            '  stdin 8:9                     root stylesheet',
        ]);
        ok(error.debug == undefined);
    });
    it('source', () => {
        const e = {
            name: 'SyntaxError',
            message: 'Cannot use import statement outside a module',
        };
        const error = extract_error(e, join(__dirname, 'gen', 'src'));

        strictEqual(error.code, undefined);
        strictEqual(error.filename, undefined);
        strictEqual(error.hint, undefined);
        strictEqual(error.message, 'Cannot use import statement outside a module');
        strictEqual(error.name, 'SyntaxError');
        strictEqual(error.source, 'gen/src');
        deepStrictEqual(error.stack, []);
        ok(error.debug == undefined);
    });
    it('stack', () => {
        const e = {
            name: 'SyntaxError',
            stack: `test
        - ${__dirname}/gen/src/test/minus
                        at ${__dirname}/gen/src/test/at`,
        };
        const error = extract_error(e);

        strictEqual(error.code, undefined);
        strictEqual(error.filename, undefined);
        strictEqual(error.hint, undefined);
        strictEqual(error.message, undefined);
        strictEqual(error.name, 'SyntaxError');
        strictEqual(error.source, undefined);
        deepStrictEqual(error.stack, ['src/test/minus', 'src/test/at']);
        ok(error.debug != undefined);
    });
    it('RangeError', () => {
        let error;
        try {
            let list = Array(Number.MAX_VALUE);
        } catch (e) {
            error = extract_error(e);
        }

        strictEqual(error.code, undefined);
        strictEqual(error.filename, undefined);
        strictEqual(error.hint, undefined);
        strictEqual(error.message, 'Invalid array length');
        strictEqual(error.name, 'RangeError');
        strictEqual(error.source, undefined);
        deepStrictEqual(error.stack, []);
        ok(error.debug != undefined);
    });
    it('ReferenceError', () => {
        let error;
        try {
            var a = a + b;
        } catch (e) {
            error = extract_error(e);
        }

        strictEqual(error.code, undefined);
        strictEqual(error.filename, undefined);
        strictEqual(error.hint, undefined);
        strictEqual(error.message, 'b is not defined');
        strictEqual(error.name, 'ReferenceError');
        strictEqual(error.source, undefined);
        deepStrictEqual(error.stack, []);
        ok(error.debug != undefined);
    });
    it('SyntaxError', () => {
        let error;
        try {
            eval('a x b');
        } catch (e) {
            error = extract_error(e);
        }

        strictEqual(error.code, undefined);
        strictEqual(error.filename, undefined);
        strictEqual(error.hint, undefined);
        strictEqual(error.message, 'Unexpected identifier');
        strictEqual(error.name, 'SyntaxError');
        strictEqual(error.source, undefined);
        deepStrictEqual(error.stack, []);
        ok(error.debug != undefined);
    });
    it('TypeError', () => {
        let error;
        try {
            let x = new 'String'();
        } catch (e) {
            error = extract_error(e);
        }
        strictEqual(error.code, undefined);
        strictEqual(error.filename, undefined);
        strictEqual(error.hint, undefined);
        strictEqual(error.message, '"String" is not a constructor');
        strictEqual(error.name, 'TypeError');
        strictEqual(error.source, undefined);
        deepStrictEqual(error.stack, []);
        ok(error.debug != undefined);
    });
    it('URIError', () => {
        let error;
        try {
            decodeURI('%');
        } catch (e) {
            error = extract_error(e);
        }
        strictEqual(error.code, undefined);
        strictEqual(error.filename, undefined);
        strictEqual(error.hint, undefined);
        strictEqual(error.message, 'URI malformed');
        strictEqual(error.name, 'URIError');
        strictEqual(error.source, undefined);
        deepStrictEqual(error.stack, []);
        ok(error.debug != undefined);
    });
    it('Maximum call stack size exceeded', () => {
        let error;
        try {
            function foo() {
                foo();
            }
            foo();
        } catch (e) {
            error = extract_error(e);
        }
        strictEqual(error.code, undefined);
        strictEqual(error.filename, undefined);
        strictEqual(error.hint, undefined);
        strictEqual(error.message, 'Maximum call stack size exceeded');
        strictEqual(error.name, 'RangeError');
        strictEqual(error.source, undefined);
        deepStrictEqual(error.stack, []);
        ok(error.debug != undefined);
    });
});

// describe('Lib/Error', () => {
//     const assert = require('assert');
//     const { Error } = require('@lib/error');
//     const cwd = process.cwd();

//     describe('extract', () => {
//         it('structure', () => {
//             const result = extract_error(new SyntaxError('hi'));
//             deepStrictEqual(Object.keys(result), ['code', 'filename', 'hint', 'message', 'name', 'source', 'stack', 'debug']);
//         });
//         it('JS error', () => {
//             const e = {
//                 name: 'TypeError',
//                 message: 'The "path" argument must be of type string or an instance of Buffer or URL. Received null',
//                 stack: `TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be of type string or an instance of Buffer or URL. Received null
//                     at Object.openSync (fs.js:453:10)
//                     at Object.readFileSync (fs.js:364:35)
//                     at ${cwd}/gen/plugins/wyvr/example/index.js:26:36
//                     at Array.forEach (<anonymous>)
//                     at Object.after [as fn] (${cwd}/gen/plugins/wyvr/example/index.js:25:19)
//                     at Function.<anonymous> (${cwd}/wyvr/plugin.js:204:85)
//                     at step (${cwd}/wyvr/plugin.js:33:23)
//                     at Object.next (${cwd}/wyvr/plugin.js:14:53)
//                     at ${cwd}/wyvr/plugin.js:8:71
//                     at new Promise (<anonymous>)`,
//             };
//             const error = extract_error(e);
//             strictEqual(error.code, null);
//             strictEqual(error.filename, null);
//             strictEqual(error.hint, null);
//             strictEqual(error.message, 'The "path" argument must be of type string or an instance of Buffer or URL. Received null');
//             strictEqual(error.name, 'TypeError');
//             strictEqual(error.source, null);
//             deepStrictEqual(error.stack, ['plugins/wyvr/example/index.js:26:36', 'Object.after [as fn] (plugins/wyvr/example/index.js:25:19)']);
//             ok(error.debug != null);
//         });
//         it('svelte error', () => {
//             const e = {
//                 name: 'SyntaxError',
//                 message: 'Cannot use import statement outside a module',
//                 stack: `${cwd}/gen/src/test/store.js:1
//                     import { writable } from 'svelte/store';
//                     ^^^^^^

//                     SyntaxError: Cannot use import statement outside a module
//                         at wrapSafe (internal/modules/cjs/loader.js:1116:16)
//                         at Module._compile (internal/modules/cjs/loader.js:1164:27)
//                         at Object.Module._extensions..js (internal/modules/cjs/loader.js:1220:10)
//                         at Module.load (internal/modules/cjs/loader.js:1049:32)
//                         at Function.Module._load (internal/modules/cjs/loader.js:937:14)
//                         at Module.require (internal/modules/cjs/loader.js:1089:19)
//                         at require (internal/modules/cjs/helpers.js:73:18)
//                         at Object.<anonymous> (${cwd}/gen/src/test/StaticStore.svelte:5:19)
//                         at Module._compile (internal/modules/cjs/loader.js:1200:30)
//                         at Object.require.extensions.<computed> [as .svelte] (${cwd}/node_modules/svelte/register.js:49:17)`,
//             };
//             const error = extract_error(e);
//             strictEqual(error.code, null);
//             strictEqual(error.filename, null);
//             strictEqual(
//                 error.hint,
//                 `                    import { writable } from 'svelte/store';
//                     ^^^^^^`
//             );
//             strictEqual(error.message, 'Cannot use import statement outside a module');
//             strictEqual(error.name, 'SyntaxError');
//             strictEqual(error.source, null);
//             deepStrictEqual(error.stack, [`src/test/store.js:1`]);
//             ok(error.debug != null);
//         });
//         it('SASS error', () => {
//             const e = {
//                 message: 'Undefined variable.',
//                 formatted:
//                     'Error: Undefined variable.\n' +
//                     '  ╷\n' +
//                     '3 │ @mixin button($color: $primary) {\n' +
//                     '  │                       ^^^^^^^^\n' +
//                     '  ╵\n' +
//                     '  gen/src/test/_test.scss 3:23  button()\n' +
//                     '  stdin 8:9                     root stylesheet',
//                 line: 3,
//                 column: 23,
//                 file: '/Users/patrick/wyvr/generator/gen/src/test/_test.scss',
//                 status: 1,
//             };
//             const error = extract_error(e, join(cwd, 'gen', 'src'));
//             strictEqual(error.code, null);
//             strictEqual(error.filename, '/Users/patrick/wyvr/generator/gen/src/test/_test.scss');
//             strictEqual(error.hint, null);
//             strictEqual(error.message, 'Undefined variable.');
//             strictEqual(error.name, null);
//             strictEqual(error.source, 'gen/src');
//             deepStrictEqual(error.stack, [
//                 'Error: Undefined variable.',
//                 '  ╷',
//                 '3 │ @mixin button($color: $primary) {',
//                 '  │                       ^^^^^^^^',
//                 '  ╵',
//                 '  gen/src/test/_test.scss 3:23  button()',
//                 '  stdin 8:9                     root stylesheet',
//             ]);
//             ok(error.debug == null);
//         });
//         it('source', () => {
//             const e = {
//                 name: 'SyntaxError',
//                 message: 'Cannot use import statement outside a module',
//             };
//             const error = extract_error(e, join(cwd, 'gen', 'src'));

//             strictEqual(error.code, null);
//             strictEqual(error.filename, null);
//             strictEqual(error.hint, null);
//             strictEqual(error.message, 'Cannot use import statement outside a module');
//             strictEqual(error.name, 'SyntaxError');
//             strictEqual(error.source, 'gen/src');
//             deepStrictEqual(error.stack, []);
//             ok(error.debug == null);
//         });
//         it('stack', () => {
//             const e = {
//                 name: 'SyntaxError',
//                 stack: `test
// - ${cwd}/gen/src/test/minus
//                 at ${cwd}/gen/src/test/at`,
//             };
//             const error = extract_error(e);

//             strictEqual(error.code, null);
//             strictEqual(error.filename, null);
//             strictEqual(error.hint, null);
//             strictEqual(error.message, null);
//             strictEqual(error.name, 'SyntaxError');
//             strictEqual(error.source, null);
//             deepStrictEqual(error.stack, ['src/test/minus', 'src/test/at']);
//             ok(error.debug != null);
//         });
//         it('RangeError', () => {
//             let error = null;
//             try {
//                 let list = Array(Number.MAX_VALUE);
//             } catch (e) {
//                 error = extract_error(e);
//             }

//             strictEqual(error.code, null);
//             strictEqual(error.filename, null);
//             strictEqual(error.hint, null);
//             strictEqual(error.message, 'Invalid array length');
//             strictEqual(error.name, 'RangeError');
//             strictEqual(error.source, null);
//             deepStrictEqual(error.stack, []);
//             ok(error.debug != null);
//         });
//         it('ReferenceError', () => {
//             let error = null;
//             try {
//                 var a = a + b;
//             } catch (e) {
//                 error = extract_error(e);
//             }

//             strictEqual(error.code, null);
//             strictEqual(error.filename, null);
//             strictEqual(error.hint, null);
//             strictEqual(error.message, 'b is not defined');
//             strictEqual(error.name, 'ReferenceError');
//             strictEqual(error.source, null);
//             deepStrictEqual(error.stack, []);
//             ok(error.debug != null);
//         });
//         it('SyntaxError', () => {
//             let error = null;
//             try {
//                 eval('a x b');
//             } catch (e) {
//                 error = extract_error(e);
//             }

//             strictEqual(error.code, null);
//             strictEqual(error.filename, null);
//             strictEqual(error.hint, null);
//             strictEqual(error.message, 'Unexpected identifier');
//             strictEqual(error.name, 'SyntaxError');
//             strictEqual(error.source, null);
//             deepStrictEqual(error.stack, []);
//             ok(error.debug != null);
//         });
//         it('TypeError', () => {
//             let error = null;
//             try {
//                 let x = new 'String'();
//             } catch (e) {
//                 error = extract_error(e);
//             }
//             strictEqual(error.code, null);
//             strictEqual(error.filename, null);
//             strictEqual(error.hint, null);
//             strictEqual(error.message, '"String" is not a constructor');
//             strictEqual(error.name, 'TypeError');
//             strictEqual(error.source, null);
//             deepStrictEqual(error.stack, []);
//             ok(error.debug != null);
//         });
//         it('URIError', () => {
//             let error = null;
//             try {
//                 decodeURI('%');
//             } catch (e) {
//                 error = extract_error(e);
//             }
//             strictEqual(error.code, null);
//             strictEqual(error.filename, null);
//             strictEqual(error.hint, null);
//             strictEqual(error.message, 'URI malformed');
//             strictEqual(error.name, 'URIError');
//             strictEqual(error.source, null);
//             deepStrictEqual(error.stack, []);
//             ok(error.debug != null);
//         });
//         it('Maximum call stack size exceeded', () => {
//             let error = null;
//             try {
//                 function foo() {
//                     foo();
//                 }
//                 foo();
//             } catch (e) {
//                 error = extract_error(e);
//             }
//             strictEqual(error.code, null);
//             strictEqual(error.filename, null);
//             strictEqual(error.hint, null);
//             strictEqual(error.message, 'Maximum call stack size exceeded');
//             strictEqual(error.name, 'RangeError');
//             strictEqual(error.source, null);
//             deepStrictEqual(error.stack, []);
//             ok(error.debug != null);
//         });
//     });
//     describe('get', () => {
//         it('output', () => {
//             const error = {
//                 name: 'SyntaxError',
//                 message: 'Cannot use import statement outside a module',
//                 stack: `test
//         - ${cwd}/gen/src/test/minus
//                 at ${cwd}/gen/src/test/at`,
//             };
//             deepStrictEqual(
//                 Error.get(error),
//                 `[\x1B[1mSyntaxError\x1B[22m] Cannot use import statement outside a module
// \x1B[2mstack\x1B[22m
// \x1B[2m-\x1B[22m src/test/at`
//             );
//         });
//         it('scoping', () => {
//             const error = {
//                 name: 'SyntaxError',
//                 stack: `test
//         - ${cwd}/gen/src/test/minus
//                 at ${cwd}/gen/src/test/at`,
//             };
//             deepStrictEqual(
//                 Error.get(error, 'file', 'test'),
//                 `\x1B[1m@test\x1B[22m
// [\x1B[1mSyntaxError\x1B[22m] -
// \x1B[2mstack\x1B[22m
// \x1B[2m-\x1B[22m src/test/at
// \x1B[2msource\x1B[22m file`
//             );
//         });
//         it('minimal', () => {
//             const error = {};
//             deepStrictEqual(Error.get(error, null, 'test'), `\x1B[1m@test\x1B[22m\n[] -\n\x1B[2mstack\x1B[22m`);
//         });
//     });
// });
