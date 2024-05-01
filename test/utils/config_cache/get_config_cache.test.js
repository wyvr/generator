import { deepStrictEqual } from 'node:assert';
import { describe } from 'mocha';
import { join } from 'node:path';
import { Config } from '../../../src/utils/config.js';
import { get_config_cache } from '../../../src/utils/config_cache.js';
import { to_dirname } from '../../../src/utils/to.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/config_cache/get_config_cache', () => {
    const __dirname = join(to_dirname(import.meta.url), '_tests');
    afterEach(() => {
        Config.replace(undefined);
    });
    after(() => {
        Cwd.set(undefined);
    });

    it('undefined', () => {
        Cwd.set(__dirname);
        deepStrictEqual(get_config_cache(), undefined);
    });
    it('empty with segment', () => {
        Cwd.set(__dirname);
        deepStrictEqual(get_config_cache('test'), undefined);
    });
    it('empty with segment and fallback', () => {
        Cwd.set(__dirname);
        deepStrictEqual(get_config_cache('test', false), false);
    });
    it('found segment and fallback', () => {
        Cwd.set(join(__dirname, 'simple'));
        deepStrictEqual(get_config_cache('test', false), { test: 'test' });
    });
    it('not found segment and fallback', () => {
        Cwd.set(join(__dirname, 'simple'));
        deepStrictEqual(get_config_cache('huhu', false), false);
    });
    it('found config', () => {
        Cwd.set(join(__dirname, 'simple'));
        Config.replace({ test: 'huhu' });
        deepStrictEqual(get_config_cache('test', false), 'huhu');
    });
});
