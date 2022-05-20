import { deepStrictEqual } from 'assert';
import { existsSync, mkdirSync, rmSync } from 'fs';
import { describe, it } from 'mocha';
import { join } from 'path';
import { Storage } from '../../../src/utils/storage.js';
import { Cwd } from '../../../src/vars/cwd.js';
import { to_dirname } from '../../../src/utils/to.js';

describe('utils/storage/get_tables', () => {
    const __dirname = to_dirname(import.meta.url);
    const __root = join(__dirname, '..', '..', '..');
    const __path = join('test', 'utils', 'storage', '_tests', 'get_tables');
    const test_folder = join(__root, __path);

    before(() => {
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
        Storage.location = undefined;
        Cwd.set(undefined);
    });
    it('no location', () => {
        const loc = Storage.location;
        Storage.location = undefined;
        const result = Storage.get_tables();
        Storage.location = loc;
        deepStrictEqual(result, []);
    });
    it('empty', () => {
        deepStrictEqual(Storage.get_tables(), []);
    });
    it('has tables', async () => {
        await Storage.create('test_get_tables_a');
        await Storage.create('test_get_tables_b');
        const result = Storage.get_tables();
        deepStrictEqual(result, ['test_get_tables_a', 'test_get_tables_b']);
    });
    it('has deep tables', async () => {
        const loc = Storage.location;
        await Storage.create('test_get_tables_a');
        Storage.location = join(loc, 'deep');
        await Storage.create('test_get_tables_b');
        Storage.location = loc;
        const result = Storage.get_tables();
        deepStrictEqual(result, ['test_get_tables_a']);
    });
});
