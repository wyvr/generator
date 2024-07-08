import { deepStrictEqual, strictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import Sinon from 'sinon';
import { Plugin } from '../../../src/utils/plugin.js';
import { Cwd } from '../../../src/vars/cwd.js';
import { to_plain } from '../../../src/utils/to.js';

describe('utils/plugin/execute', () => {
    let logger_messages = [];
    before(() => {
        Cwd.set(process.cwd());
        Sinon.stub(console, 'log');
        console.log.callsFake((...msg) => {
            logger_messages.push(msg.map(to_plain));
        });
    });
    afterEach(() => {
        logger_messages = [];
        Plugin.clear();
    });
    after(() => {
        console.log.restore();
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
                            return result.map((i) => `a${i}`);
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
                '✖',
                'error in plugin for a after @plugin\n' +
                    '[SyntaxError] missing code\n' +
                    'source error',
            ],
        ]);
    });
});
