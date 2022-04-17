import { deepStrictEqual, strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { Plugin } from '../../../src/utils/plugin.js';

describe('utils/plugin/load', () => {
    const __dirname = dirname(resolve(join(fileURLToPath(import.meta.url))));

    it('undefined', async () => {
        deepStrictEqual(await Plugin.load(), undefined);
    });
    it('non existing', async () => {
        deepStrictEqual(await Plugin.load(join(__dirname, '_tests/nonexisting')), undefined);
    });
    it('simple', async () => {
        deepStrictEqual(await Plugin.load(join(__dirname, '_tests/simple')), [join(__dirname, '_tests/simple/gen/plugin/test/index.js')]);
    });
});
