import { deepStrictEqual, strictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import Sinon from 'sinon';
import { Plugin } from '../../../src/utils/plugin.js';
import { to_dirname, to_plain } from '../../../src/utils/to.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/plugin/process', () => {
    const __dirname = to_dirname(import.meta.url);
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
        const plugin = await Plugin.process('a', 1);
        strictEqual(typeof plugin, 'function');
        const result = await plugin();
        deepStrictEqual(result, 1);
        deepStrictEqual(logger_messages, [
            ['⚠', 'no main function for plugin "a"'],
        ]);
    });
    it('no plugins defined', async () => {
        const plugin = await Plugin.process('a', 1);
        strictEqual(typeof plugin, 'function');
        const result = await plugin((result) => result);
        deepStrictEqual(result, 1);
        deepStrictEqual(logger_messages, []);
    });
    it('no errors', async () => {
        Plugin.cache = {
            a: {
                before: [
                    {
                        fn: (result) => {
                            return result;
                        },
                        source: 'before',
                    },
                ],
                after: [
                    {
                        fn: (result) => {
                            return result;
                        },
                        source: 'after',
                    },
                ],
            },
        };
        const plugin = await Plugin.process('a', 1);
        strictEqual(typeof plugin, 'function');
        const result = await plugin((result) => result);
        deepStrictEqual(result, 1);
        deepStrictEqual(logger_messages, []);
    });
    it('check correct result', async () => {
        Plugin.cache = {
            a: {
                before: [
                    {
                        fn: (result) => {
                            return result;
                        },
                        source: 'before',
                    },
                ],
                after: [
                    {
                        fn: (result) => {
                            return result;
                        },
                        source: 'after',
                    },
                ],
            },
        };
        const plugin = await Plugin.process('a', 1);
        strictEqual(typeof plugin, 'function');
        const result = await plugin((result) =>
            result + 10
        );
        deepStrictEqual(result, 11);
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
        const plugin = await Plugin.process('a', 1);
        strictEqual(typeof plugin, 'function');
        const result = await plugin((result) => result);
        deepStrictEqual(result, 1);
        deepStrictEqual(logger_messages, []);
    });
});
