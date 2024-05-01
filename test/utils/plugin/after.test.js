import { deepStrictEqual, strictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import Sinon from 'sinon';
import { Plugin } from '../../../src/utils/plugin.js';

describe('utils/plugin/after', () => {
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
                ],
            },
        };
        const { args, error, result } = await Plugin.after('a', [], 1, 2);
        deepStrictEqual(error, undefined);
        deepStrictEqual(result, ['a2', 'a3']);
        deepStrictEqual(args, [1, 2]);
        deepStrictEqual(logger_messages, []);
    });
});
