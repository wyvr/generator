import { deepStrictEqual, strictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import Sinon from 'sinon';
import { Plugin } from '../../../src/utils/plugin.js';
import { to_dirname } from '../../../src/utils/to.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/plugin/execute', () => {
    const __dirname = to_dirname(import.meta.url);
    let logger_messages = [];
    before(() => {
        Cwd.set(process.cwd());
        Sinon.stub(console, 'error');
        console.error.callsFake((...msg) => {
            logger_messages.push(msg);
        });
    });
    afterEach(() => {
        logger_messages = [];
        Plugin.clear();
    });
    after(() => {
        console.error.restore();
        Cwd.set(undefined);
    });
    it('undefined', async () => {
        const plugin = await Plugin.execute();
        strictEqual(typeof plugin, 'function');
        const { args, error, result } = await plugin(undefined, 1, 2);
        deepStrictEqual(error, 'missing plugin name or type');
        deepStrictEqual(args, undefined);
        deepStrictEqual(result, undefined);
        deepStrictEqual(logger_messages, []);
    });
    it('not found', async () => {
        const plugin = await Plugin.execute('a', 'after');
        strictEqual(typeof plugin, 'function');
        const { args, error, result } = await plugin(undefined, 1, 2);
        deepStrictEqual(error, 'no after plugin for "a" found');
        deepStrictEqual(args, [1, 2]);
        deepStrictEqual(result, undefined);
        deepStrictEqual(logger_messages, []);
    });
    it('found', async () => {
        Plugin.cache = {
            a: {
                after: [
                    {
                        fn: ({ result }) => {
                            return result.map((i) => 'a' + i);
                        },
                        source: 'first',
                    },
                    {
                        fn: ({ args }) => {
                            return args.map((i) => i + 1);
                        },
                        source: 'second',
                    },
                    {
                        fn: () => {
                            throw SyntaxError('missing code');
                        },
                        source: 'error',
                    },
                ],
            },
        };
        const plugin = await Plugin.execute('a', 'after');
        strictEqual(typeof plugin, 'function');
        const { args, error, result } = await plugin([], 1, 2);
        deepStrictEqual(error, undefined);
        deepStrictEqual(args, [1, 2]);
        deepStrictEqual(result, ['a2', 'a3']);
        deepStrictEqual(logger_messages, [
            [
                '\x1B[31m✖\x1B[39m',
                '\x1B[31merror in plugin for \x1B[1ma\x1B[22m \x1B[1mafter\x1B[22m \x1B[1m@plugin\x1B[22m\n' +
                    '[\x1B[1mSyntaxError\x1B[22m] missing code\n' +
                    '\x1B[2msource\x1B[22m error\x1B[39m',
            ],
        ]);
    });
});
