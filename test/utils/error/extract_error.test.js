import { deepStrictEqual, strictEqual, ok } from 'assert';
import { describe, it } from 'mocha';
import { join } from 'path';
import { extract_error } from '../../../src/utils/error.js';
import { to_dirname } from '../../../src/utils/to.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/error/extract_error', () => {
    const __dirname = to_dirname(import.meta.url);
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
            file: cwd + '/gen/src/test/_test.scss',
            status: 1,
        };
        const error = extract_error(e, join(__dirname, 'gen', 'src'));
        strictEqual(error.code, undefined);
        strictEqual(error.filename, cwd + '/gen/src/test/_test.scss');
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
    it('Typescript error', () => {
        const e = {
            errors: [],
            warnings: [],
            message: 'Transform failed with 1 error:\n<stdin>:3:8: ERROR: Unexpected end of file',
            stack: 'Error: Transform failed with 1 error:\n<stdin>:3:8: ERROR: Unexpected end of file\n    at failureErrorWithLog (~/node_modules/.pnpm/esbuild@0.14.27/node_modules/esbuild/lib/main.js:1599:15)\n    at ~/node_modules/.pnpm/esbuild@0.14.27/node_modules/esbuild/lib/main.js:1388:29\n    at ~/node_modules/.pnpm/esbuild@0.14.27/node_modules/esbuild/lib/main.js:662:9\n    at handleIncomingPacket (~/node_modules/.pnpm/esbuild@0…js:759:9)\n    at Socket.readFromStdout (~/node_modules/.pnpm/esbuild@0.14.27/node_modules/esbuild/lib/main.js:629:7)\n    at Socket.emit (node:events:526:28)\n    at addChunk (node:internal/streams/readable:315:12)\n    at readableAddChunk (node:internal/streams/readable:289:9)\n    at Socket.Readable.push (node:internal/streams/readable:228:10)\n    at Pipe.onStreamRead (node:internal/stream_base_commons:190:23)\n    at Pipe.callbackTrampoline (node:internal/async_hooks:130:17)',
        };
        const error = extract_error(e, join(__dirname, 'gen', 'src'));
        strictEqual(error.code, undefined);
        strictEqual(error.filename, undefined);
        strictEqual(error.hint, undefined);
        strictEqual(error.message, 'Transform failed with 1 error:\n<stdin>:3:8: ERROR: Unexpected end of file');
        strictEqual(error.name, undefined);
        strictEqual(error.source, 'gen/src');
        deepStrictEqual(error.stack, ['3:8: ERROR: Unexpected end of file']);
        ok(error.debug != undefined);
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
    it('svelte frame', () => {
        const error = extract_error({
            frame: 'a\nb',
        });
        deepStrictEqual(error.stack, ['a', 'b']);
    });
    it('esbuild error', () => {
        const error = extract_error({
            name: 'Error',
            errors: [
                {
                    detail: undefined,
                    id: '',
                    location: {
                        column: 17,
                        file: 'test/utils/build/_tests/gen/tmp/416e310ccc464fa1bc3da767bc4d791b.js',
                        length: 13,
                        line: 130,
                        lineText: "import file from 'file.svelte';",
                        namespace: '',
                        suggestion: '',
                    },
                    notes: [],
                    pluginName: '',
                    text: 'Could not resolve "file.svelte"',
                },
                {
                    detail: undefined,
                    id: '',
                    location: {},
                    notes: [],
                    pluginName: '',
                    text: 'errortext',
                },
            ],
        });
        deepStrictEqual(
            error.message,
            '\n' +
                '- Could not resolve "file.svelte"\n' +
                'test/utils/build/_tests/gen/tmp/416e310ccc464fa1bc3da767bc4d791b.js @ 130:17\n' +
                '\n' +
                "130 | \x1B[2mimport file from \x1B[22m\x1B[1m'file.svelte'\x1B[22m\x1B[2m;\x1B[22m\n" +
                '                       ^^^^^^^^^^^^^\n' +
                '\n' +
                '\n' +
                '- errortext\n' +
                '\n'
        );
    });
});
