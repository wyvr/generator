import { deepStrictEqual, strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { dirname, join, resolve } from 'path';
import Sinon from 'sinon';
import { fileURLToPath } from 'url';
import { Plugin } from '../../../src/utils/plugin.js';

describe('utils/plugin/execute', () => {
    const __dirname = dirname(resolve(join(fileURLToPath(import.meta.url))));
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
        const plugin = await Plugin.execute('a', 'after');
        strictEqual(typeof plugin, 'function');
        const { args, error } = await plugin(1, 2);
        deepStrictEqual(error, undefined);
        deepStrictEqual(args, ['a2', 'a3']);
        deepStrictEqual(logger_messages, []);
    });
    it('not found', async () => {
        const plugin = await Plugin.execute('a', 'after');
        strictEqual(typeof plugin, 'function');
        const { args, error } = await plugin(1, 2);
        deepStrictEqual(error, "plugin \"a\" after not found");
        deepStrictEqual(args, undefined);
        deepStrictEqual(logger_messages, []);
    });
    it('found', async () => {
        Plugin.cache = {
            a: {
                after: [
                    ({ error, args }) => {
                        return { error, args: args.map((i) => i + 1) };
                    },
                    ({ error, args }) => {
                        return { error, args: args.map((i) => 'a' + i) };
                    },
                ],
            },
        };
        const plugin = await Plugin.execute('a', 'after');
        strictEqual(typeof plugin, 'function');
        const { args, error } = await plugin(1, 2);
        deepStrictEqual(error, undefined);
        deepStrictEqual(args, ['a2', 'a3']);
        deepStrictEqual(logger_messages, []);
    });
});
