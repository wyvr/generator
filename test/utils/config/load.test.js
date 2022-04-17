import { deepStrictEqual, strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { Config } from '../../../src/utils/config.js';

describe('utils/config/load', () => {
    const __dirname = dirname(resolve(join(fileURLToPath(import.meta.url))));

    it('undefined', async () => {
        const config = await Config.load();
        deepStrictEqual(config, {});
    });
    it('empty', async () => {
        const config = await Config.load(join(__dirname, '_tests/empty/'));
        deepStrictEqual(config, {});
    });
    it('simple', async () => {
        const config = await Config.load(join(__dirname, '_tests/simple/'));
        deepStrictEqual(config, { url: 'simple' });
    });
    it('dynamic', async () => {
        const config = await Config.load(join(__dirname, '_tests/dynamic/'));
        deepStrictEqual(config, { url: 'dynamic' });
    });
});
