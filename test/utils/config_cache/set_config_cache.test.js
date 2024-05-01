import { deepStrictEqual } from 'node:assert';
import { readdirSync } from 'node:fs';
import { describe } from 'mocha';
import { join } from 'node:path';
import { Config } from '../../../src/utils/config.js';
import { set_config_cache } from '../../../src/utils/config_cache.js';
import { exists, read, remove } from '../../../src/utils/file.js';
import { to_dirname } from '../../../src/utils/to.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/config_cache/set_config_cache', () => {
    const __dirname = join(to_dirname(import.meta.url), '_tests', 'set');
    before(() => {
        Cwd.set(__dirname);
    });
    afterEach(() => {
        Config.replace(undefined);
        remove(__dirname);
    });
    after(() => {
        Cwd.set(undefined);
    });

    it('undefined', () => {
        set_config_cache();

        deepStrictEqual(exists(__dirname), false);
    });
    it('empty value', () => {
        set_config_cache('test');

        deepStrictEqual(readdirSync(join(__dirname, 'cache')), ['test.json']);
        deepStrictEqual(read(join(__dirname, 'cache', 'test.json')), 'null');
    });
    it('set value', () => {
        set_config_cache('test', false);

        deepStrictEqual(readdirSync(join(__dirname, 'cache')), ['test.json']);
        deepStrictEqual(read(join(__dirname, 'cache', 'test.json')), 'false');
    });
});
