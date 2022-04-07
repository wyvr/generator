import { deepStrictEqual, ok, strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { Plugin } from '../../../src/utils/plugin.js';

describe('utils/plugin/generate', () => {
    const __dirname = dirname(resolve(join(fileURLToPath(import.meta.url))));
    let log, err;
    let result = [];

    before(() => {
        // runs once before the first test in this block
        log = console.log;
        console.log = (...args) => {
            result.push(args);
        };
        err = console.error;
        console.error = (...args) => {
            result.push(args);
        };
    });
    afterEach(() => {
        result = [];
        Plugin.clear();
    });
    after(() => {
        // runs once after the last test in this block
        console.log = log;
        console.error = err;
    });
    it('undefined', async () => {
        deepStrictEqual(await Plugin.generate(), undefined);
    });
    it('non existing', async () => {
        deepStrictEqual(await Plugin.generate(['test/utils/plugin/_tests/simple/gen/plugin/test/nope.js']), {});
    });
    it('simple', async () => {
        const plugin = await Plugin.generate(['test/utils/plugin/_tests/simple/gen/plugin/test/index.js']);
        deepStrictEqual(result, []);
        ok(plugin.test != undefined, 'test');
        ok(plugin.test.before != undefined, 'test.before');
        ok(plugin.test.after != undefined, 'test.after');
    });
    it('unknown type', async () => {
        const plugin = await Plugin.generate(['test/utils/plugin/_tests/unknown_type/gen/plugin/test/index.js']);
        deepStrictEqual(result, [
            [
                '\x1B[33m⚠\x1B[39m',
                '\x1B[33munkown plugin type huhu test/utils/plugin/_tests/unknown_type/gen/plugin/test/index.js\x1B[39m',
            ],
        ]);
        deepStrictEqual(plugin, {
            test: { before: [], after: [] },
        });
    });
});
