import { strictEqual } from 'node:assert';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { describe, it } from 'mocha';
import { join } from 'node:path';
import { StorageCacheStructure } from '../../../src/struc/storage.js';
import { Storage } from '../../../src/utils/storage.js';
import { to_dirname } from '../../../src/utils/to.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/storage/clear', () => {
    const __dirname = to_dirname(import.meta.url);
    const __root = join(__dirname, '..', '..', '..');
    const __path = join('test', 'utils', 'storage', '_tests', 'clear');
    const test_folder = join(__root, __path);

    before(async () => {
        Cwd.set(__root);
        Storage.set_location(__path);
    });
    beforeEach(() => {
        mkdirSync(test_folder, { recursive: true });
    });
    afterEach(() => {
        if (existsSync(test_folder)) {
            rmSync(test_folder, { recursive: true, force: true });
        }
        Storage.cache = {};
    });
    after(() => {
        Storage.cache = {};
        Storage.location = undefined;
        Cwd.set(undefined);
    });
    it('undefined', async () => {
        strictEqual(await Storage.clear(), false);
    });
    it('clear non existing', async () => {
        strictEqual(await Storage.clear('test_clear_non_existing'), false);
    });
    it('clear existing', async () => {
        await Storage.open('test_clear');
        await Storage.set('test_clear', 'key', 'value');
        strictEqual(await Storage.clear('test_clear'), true);
    });
    it('broken cache', async () => {
        await Storage.create('test_clear');
        Storage.cache['test_clear'] = StorageCacheStructure;
        strictEqual(await Storage.clear('test_clear'), false);
    });
});
