import { strictEqual } from 'assert';
import { existsSync, unlinkSync } from 'fs';
import { describe, it } from 'mocha';
import { join } from 'path';
import { Storage } from '../../../src/utils/storage.js';
import { to_dirname } from '../../../src/utils/to.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/storage/create', () => {
    const __dirname = to_dirname(import.meta.url);
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
        strictEqual(await Storage.create(), false);
    });
    it('create', async () => {
        const created = await Storage.create('test_create');
        strictEqual(created, true);
        const path = join(__root, 'test', 'utils', 'storage', '_tests', 'test_create.db');
        strictEqual(existsSync(path), true, "file doesn't exist");
        unlinkSync(path);
    });
    it('create existing', async () => {
        await Storage.create('test_create_existing');
        const created = await Storage.create('test_create_existing');
        strictEqual(created, true);
        const path = join(__root, 'test', 'utils', 'storage', '_tests', 'test_create_existing.db');
        strictEqual(existsSync(path), true, "file doesn't exist");
        unlinkSync(path);
    });
});
