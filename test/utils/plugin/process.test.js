import { deepStrictEqual, strictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import Sinon from 'sinon';
import { Plugin } from '../../../src/utils/plugin.js';
import { to_dirname } from '../../../src/utils/to.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/plugin/process', () => {
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
        const plugin = await Plugin.process('a', 1, 2);
        strictEqual(typeof plugin, 'function');
        const { args, error } = await plugin();
        deepStrictEqual(error, ['missing plugin function']);
        deepStrictEqual(args, [1, 2]);
        deepStrictEqual(logger_messages, []);
    });
    it('no plugins found messages', async () => {
        const plugin = await Plugin.process('a', 1, 2);
        strictEqual(typeof plugin, 'function');
        const { args, error } = await plugin((...args) => args);
        deepStrictEqual(error, ['no before plugin for "a" found', 'no after plugin for "a" found']);
        deepStrictEqual(args, [1, 2]);
        deepStrictEqual(logger_messages, []);
    });
    it('no errors', async () => {
        Plugin.cache = {
            a: {
                before: [
                    {
                        fn: ({ result }) => {
                            return result;
                        },
                        source: 'before',
                    },
                ],
                after: [
                    {
                        fn: ({ result }) => {
                            return result;
                        },
                        source: 'after',
                    },
                ],
            },
        };
        const plugin = await Plugin.process('a', 1, 2);
        strictEqual(typeof plugin, 'function');
        const { args, error, result } = await plugin((...args) => args);
        deepStrictEqual(error, undefined);
        deepStrictEqual(args, [1, 2]);
        deepStrictEqual(result, [1, 2]);
        deepStrictEqual(logger_messages, []);
    });
    it('check correct result', async () => {
        Plugin.cache = {
            a: {
                before: [
                    {
                        fn: ({ args }) => {
                            return args;
                        },
                        source: 'before',
                    },
                ],
                after: [
                    {
                        fn: ({ result }) => {
                            return result;
                        },
                        source: 'after',
                    },
                ],
            },
        };
        const plugin = await Plugin.process('a', 1, 2);
        strictEqual(typeof plugin, 'function');
        const { args, error, result } = await plugin((...args) => args.reduce((acc, i) => acc + i, 1));
        deepStrictEqual(error, undefined);
        deepStrictEqual(args, [1, 2]);
        deepStrictEqual(result, 4);
        deepStrictEqual(logger_messages, []);
    });
    it('undefined return in plugins', async () => {
        Plugin.cache = {
            a: {
                before: [
                    {
                        fn: () => {},
                        source: 'before',
                    },
                ],
                after: [
                    {
                        fn: () => {},
                        source: 'after',
                    },
                ],
            },
        };
        const plugin = await Plugin.process('a', 1, 2);
        strictEqual(typeof plugin, 'function');
        const { args, error, result } = await plugin((...args) => args);
        deepStrictEqual(error, undefined);
        deepStrictEqual(args, [1, 2]);
        deepStrictEqual(result, [1, 2]);
        deepStrictEqual(logger_messages, []);
    });
});
