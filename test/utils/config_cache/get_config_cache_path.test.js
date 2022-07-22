import { deepStrictEqual } from 'assert';
import { readdirSync } from 'fs';
import { describe } from 'mocha';
import { join } from 'path';
import { get_config_cache_path } from '../../../src/utils/config_cache.js';
import { remove } from '../../../src/utils/file.js';
import { to_dirname } from '../../../src/utils/to.js';
import { Cwd } from '../../../src/vars/cwd.js';
import { Env } from '../../../src/vars/env.js';

describe('utils/config_cache/get_config_cache_path', () => {
    before(()=> {
        Cwd.set('.');
    });
    after(()=> {
        Cwd.set(undefined);
    });
    it('undefined', () => {
        deepStrictEqual(get_config_cache_path(), undefined);
    });
    it('simple segment', () => {
        deepStrictEqual(get_config_cache_path('segment'), 'cache/segment.json');
    });
    it('complex segments', () => {
        deepStrictEqual(get_config_cache_path('segment.236L163'), 'cache/segment_236L163.json');
    });
});
