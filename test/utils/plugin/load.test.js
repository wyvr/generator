import { deepStrictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { join } from 'node:path';
import { Plugin } from '../../../src/utils/plugin.js';
import { to_dirname } from '../../../src/utils/to.js';

describe('utils/plugin/load', () => {
    const __dirname = to_dirname(import.meta.url);

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
