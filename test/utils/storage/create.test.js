import { strictEqual, deepStrictEqual } from 'assert';
import { existsSync, unlinkSync } from 'fs';
import { describe, it } from 'mocha';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { Storage } from '../../../src/utils/storage.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/storage/create', () => {
    const __dirname = dirname(resolve(join(fileURLToPath(import.meta.url))));
    const __root = join(__dirname, '..', '..', '..');

    before(() => {
        Cwd.set(__root);
        const path = join('test', 'utils', 'storage', '_tests');
        Storage.set_location(path);
    });
    after(() => {
        Storage.location = undefined;
        Cwd.set(undefined);
    });
    it('undefined', async () => {
        strictEqual(await Storage.create(), undefined);
    });
    it('create', async () => {
        const created = await Storage.create('test_create');
        strictEqual(created, true);
        const path = join(__root, 'test', 'utils', 'storage', '_tests', 'test_create.db');
        strictEqual(existsSync(path), true, "file doesn't exist");
        unlinkSync(path);
    });
});
