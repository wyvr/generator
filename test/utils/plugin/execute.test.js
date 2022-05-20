import { deepStrictEqual, strictEqual } from 'assert';
import { describe, it } from 'mocha';
import Sinon from 'sinon';
import { Plugin } from '../../../src/utils/plugin.js';
import { to_dirname } from '../../../src/utils/to.js';

describe('utils/plugin/execute', () => {
    const __dirname = to_dirname(import.meta.url);
    let logger_messages = [];
    before(() => {
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
    });
    it('undefined', async () => {
        const plugin = await Plugin.execute();
        strictEqual(typeof plugin, 'function');
        const { args, error } = await plugin(1, 2);
        deepStrictEqual(error, 'missing plugin name or type');
        deepStrictEqual(args, undefined);
        deepStrictEqual(logger_messages, []);
    });
    it('not found', async () => {
        const plugin = await Plugin.execute('a', 'after');
        strictEqual(typeof plugin, 'function');
        const { args, error } = await plugin(1, 2);
        deepStrictEqual(error, 'plugin "a" after not found');
        deepStrictEqual(args, undefined);
        deepStrictEqual(logger_messages, []);
    });
    it('found', async () => {
        Plugin.cache = {
            a: {
                after: [
                    {
                        fn: ({ error, args }) => {
                            return { error, args: args.map((i) => 'a' + i) };
                        },
                        source: 'first',
                    },
                    {
                        fn: ({ error, args }) => {
                            return { error, args: args.map((i) => i + 1) };
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
        const { args, error } = await plugin(1, 2);
        deepStrictEqual(error, undefined);
        deepStrictEqual(args, ['a2', 'a3']);
        deepStrictEqual(logger_messages, [
            [
                '\x1B[31m✖\x1B[39m',
                '\x1B[31merror in plugin for \x1B[1ma\x1B[22m \x1B[1mafter\x1B[22m \x1B[1m@plugin\x1B[22m\n' +
                    '[\x1B[1mSyntaxError\x1B[22m] missing code\n' +
                    '\x1B[2mstack\x1B[22m\n' +
                    '\x1B[2msource\x1B[22m error\x1B[39m',
            ],
        ]);
    });
});
