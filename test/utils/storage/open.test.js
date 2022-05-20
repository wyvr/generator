import { strictEqual } from 'assert';
import { unlinkSync, writeFileSync } from 'fs';
import { describe, it } from 'mocha';
import { join } from 'path';
import { Storage } from '../../../src/utils/storage.js';
import { to_dirname } from '../../../src/utils/to.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/storage/open', () => {
    const __dirname = to_dirname(import.meta.url);
    const __root = join(__dirname, '..', '..', '..');
    const path = join('test', 'utils', 'storage', '_tests');

    before(async () => {
        Cwd.set(__root);
        Storage.set_location(path);
    });
    after(() => {
        Storage.cache = {};
        Storage.location = undefined;
        Cwd.set(undefined);
    });
    it('undefined', async () => {
        strictEqual((await Storage.open()) == undefined, true);
    });
    it('open', async () => {
        strictEqual((await Storage.open('test_open')) != undefined, true);
        unlinkSync(join(path, 'test_open.db'));
    });
    it('open existing db', async () => {
        await Storage.open('test_open_existing');
        strictEqual((await Storage.open('test_open_existing')) != undefined, true);
        unlinkSync(join(path, 'test_open_existing.db'));
    });
    it('open existing empty db', async () => {
        writeFileSync(join(path, 'test_open_existing.db'), '', { encoding: 'utf8' });
        strictEqual((await Storage.open('test_open_existing')) != undefined, true);
        unlinkSync(join(path, 'test_open_existing.db'));
    });
    it('open non connectable db', async () => {
        Storage.cache = {
            test_open: {},
        };
        strictEqual((await Storage.open('test_open')) != undefined, true);
        unlinkSync(join(path, 'test_open.db'));
    });
});
