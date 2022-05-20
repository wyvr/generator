import { deepStrictEqual } from 'assert';
import { unlinkSync } from 'fs';
import { describe, it } from 'mocha';
import { join } from 'path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { Storage } from '../../../src/utils/storage.js';
import { Cwd } from '../../../src/vars/cwd.js';
import { to_dirname } from '../../../src/utils/to.js';

describe('utils/storage/details', () => {
    const __dirname = to_dirname(import.meta.url);
    const __root = join(__dirname, '..', '..', '..');
    const __path = join('test', 'utils', 'storage', '_tests');
    const existing_path = join(__root, __path, 'test_details_existing.db');
    let connected;

    before(async () => {
        Cwd.set(__root);
        Storage.set_location(__path);
        connected = await open({
            filename: existing_path,
            driver: sqlite3.Database,
        });
    });
    after(async () => {
        Storage.cache = {};
        Storage.location = undefined;
        Cwd.set(undefined);
        unlinkSync(existing_path)
    });
    it('undefined', () => {
        deepStrictEqual(Storage.details(), {
            name: undefined,
            path: undefined,
            exists: false,
            connected: false,
        });
    });
    it('not existing', () => {
        const name = 'test_details_missing';
        deepStrictEqual(Storage.details(name), {
            name,
            path: join(__root, __path, name + '.db'),
            exists: false,
            connected: false,
        });
    });
    it('existing', () => {
        deepStrictEqual(Storage.details('test_details_existing'), {
            name: 'test_details_existing',
            path: existing_path,
            exists: true,
            connected: false,
        });
    });
    it('existing with wrong cache', () => {
        Storage.cache = {
            test_details_existing: true,
        };
        deepStrictEqual(Storage.details('test_details_existing'), {
            name: 'test_details_existing',
            path: existing_path,
            exists: true,
            connected: false,
        });
    });
    it('existing connected', async () => {
        Storage.cache = {
            test_details_existing: connected,
        };
        deepStrictEqual(Storage.details('test_details_existing'), {
            name: 'test_details_existing',
            path: existing_path,
            exists: true,
            connected: true,
        });
    });
    it('not existing but connected', async () => {
        Storage.cache = {
            test_details_non_existing: connected,
        };
        deepStrictEqual(Storage.details('test_details_non_existing'), {
            name: 'test_details_non_existing',
            path: join(__root, __path, 'test_details_non_existing.db'),
            exists: false,
            connected: false,
        });
    });
});
