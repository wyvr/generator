import { deepStrictEqual, strictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'url';
import { Plugin } from '../../../src/utils/plugin.js';

describe('utils/plugin/clear', () => {
    it('reset cache', async () => {
        Plugin.cache = true;
        Plugin.clear();
        deepStrictEqual(Plugin.cache, {});
    });
});
