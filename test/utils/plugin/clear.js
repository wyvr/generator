import { deepStrictEqual, strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { Plugin } from '../../../src/utils/plugin.js';

describe('utils/plugin/clear', () => {
    it('reset cache', async () => {
        Plugin.cache = true;
        Plugin.clear();
        deepStrictEqual(Plugin.cache, {});
    });
});
