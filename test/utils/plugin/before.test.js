import { deepStrictEqual, strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { dirname, join, resolve } from 'path';
import Sinon from 'sinon';
import { fileURLToPath } from 'url';
import { Plugin } from '../../../src/utils/plugin.js';

describe('utils/plugin/before', () => {
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
                before: [
                    {
                        fn: ({ error, args }) => {
                            return { error, args: args.map((i) => i + 1) };
                        },
                        source: 'first',
                    },
                    {
                        fn: ({ error, args }) => {
                            return { error, args: args.map((i) => 'a' + i) };
                        },
                        source: 'second',
                    },
                ],
            },
        };
        const { args, error } = await Plugin.before('a', 1, 2);
        deepStrictEqual(error, undefined);
        deepStrictEqual(args, ['a2', 'a3']);
        deepStrictEqual(logger_messages, []);
    });
});
