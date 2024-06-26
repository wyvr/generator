import { deepStrictEqual } from 'node:assert';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { describe, it } from 'mocha';
import { join } from 'node:path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { StorageCacheStructure } from '../../../src/struc/storage.js';
import { Storage } from '../../../src/utils/storage.js';
import { Cwd } from '../../../src/vars/cwd.js';
import { to_dirname } from '../../../src/utils/to.js';

describe('utils/storage/set', () => {
    const __dirname = to_dirname(import.meta.url);
    const __root = join(__dirname, '..', '..', '..');
    const __path = join('test', 'utils', 'storage', '_tests', 'set');
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
        deepStrictEqual(await Storage.set(), false);
    });
    it('missing key or data', async () => {
        deepStrictEqual(await Storage.set('test_set'), false);
    });
    it('delete value', async () => {
        deepStrictEqual(await Storage.set('test_set', 'key'), true);
    });
    it('new database', async () => {
        deepStrictEqual(await Storage.set('test_set_new', 'key', 'value'), true);
    });
    it('set', async () => {
        await Storage.open('test_set');
        deepStrictEqual(await Storage.set('test_set', 'key', 'value'), true);
    });
    it('invalid database', async () => {
        await Storage.create('test_set');
        Storage.cache['test_set'] = StorageCacheStructure;
        deepStrictEqual(await Storage.set('test_set', 'key', 'value'), false);
    });
    it('overwrite', async () => {
        await Storage.open('test_set');
        await Storage.set('test_set', 'key', 'value');
        deepStrictEqual(await Storage.set('test_set', 'key', 'value'), true);
    });
    it('set data', async () => {
        await Storage.open('test_set');
        deepStrictEqual(await Storage.set('test_set', { key: 'value', another_key: 'another value' }), true);
    });
    it('set data invalid database', async () => {
        const db_path = join(test_folder, 'test_set_invalid.db');
        const db = await open({
            filename: db_path,
            driver: sqlite3.Database,
        });
        await db.exec(`CREATE TABLE IF NOT EXISTS "data" (
            idx INTEGER,
            text TEXT
            );`);
        deepStrictEqual(await Storage.set('test_set_invalid', { key: 'value', another_key: 'another value' }), false);
        rmSync(db_path);
    });
    it('set empty data', async () => {
        await Storage.open('test_set');
        deepStrictEqual(await Storage.set('test_set', {}), false);
    });
});
