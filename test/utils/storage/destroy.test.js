import { strictEqual, deepStrictEqual } from 'assert';
import { existsSync, unlinkSync } from 'fs';
import { describe, it } from 'mocha';
import { dirname, join, resolve } from 'path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { fileURLToPath } from 'url';
import { Storage } from '../../../src/utils/storage.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/storage/destroy', () => {
    const __dirname = dirname(resolve(join(fileURLToPath(import.meta.url))));
    const __root = join(__dirname, '..', '..', '..');
    const __path = join('test', 'utils', 'storage', '_tests');

    before(async () => {
        Cwd.set(__root);
        Storage.set_location(__path);
    });
    after(async () => {
        Storage.cache = {};
        Storage.location = undefined;
        Cwd.set(undefined);
    });
    it('undefined', () => {
        strictEqual(Storage.destroy(), false);
    });
    it('not existing', () => {
        strictEqual(Storage.destroy('test_destroy'), false);
    });
    it('existing', async () => {
        await Storage.create('test_destroy');
        strictEqual(Storage.destroy('test_destroy'), true);
        strictEqual(Storage.cache['test_destroy'], undefined, 'not destroyed from cache');
        strictEqual(existsSync(join(__path, 'test_destroy.db')), false, 'file not destroyed');
    });
});
