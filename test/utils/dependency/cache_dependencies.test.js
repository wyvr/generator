import { deepStrictEqual } from 'node:assert';
import { readdirSync } from 'node:fs';
import { describe } from 'mocha';
import { join } from 'node:path';
import { Config } from '../../../src/utils/config.js';
import { cache_dependencies } from '../../../src/utils/dependency.js';
import { exists, read_json, remove } from '../../../src/utils/file.js';
import { to_dirname } from '../../../src/utils/to.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/dependency/cache_dependencies', () => {
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
        deepStrictEqual(cache_dependencies(), undefined);

        deepStrictEqual(exists(__dirname), false);
    });
    it('set simple dependencies', () => {
        deepStrictEqual(cache_dependencies({ file: ['d1', 'd2'] }), { file: ['d1', 'd2'] });

        deepStrictEqual(readdirSync(join(__dirname, 'cache')), ['dependencies_bottom.json', 'dependencies_top.json']);
        deepStrictEqual(read_json(join(__dirname, 'cache', 'dependencies_top.json')), { file: ['d1', 'd2'] });
        deepStrictEqual(read_json(join(__dirname, 'cache', 'dependencies_bottom.json')), {
            d1: ['file'],
            d2: ['file']
        });
    });
    it('set dependencies with dirty values', () => {
        deepStrictEqual(cache_dependencies({ file: ['d1', 'd2', 'd1'] }), { file: ['d1', 'd2'] });

        deepStrictEqual(readdirSync(join(__dirname, 'cache')), ['dependencies_bottom.json', 'dependencies_top.json']);
        deepStrictEqual(read_json(join(__dirname, 'cache', 'dependencies_top.json')), { file: ['d1', 'd2'] });
        deepStrictEqual(read_json(join(__dirname, 'cache', 'dependencies_bottom.json')), {
            d1: ['file'],
            d2: ['file']
        });
    });
    it('normalize: fix of server and client file dependencies', () => {
        deepStrictEqual(cache_dependencies({ file: ['server/d1', 'client/d2', 'src/d3'] }), { file: ['src/d1', 'src/d2', 'src/d3'] });
    });
});
