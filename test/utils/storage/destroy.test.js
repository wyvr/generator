import { strictEqual } from 'assert';
import { existsSync } from 'fs';
import { describe, it } from 'mocha';
import { join } from 'path';
import { Storage } from '../../../src/utils/storage.js';
import { Cwd } from '../../../src/vars/cwd.js';
import { to_dirname } from '../../../src/utils/to.js';

describe('utils/storage/destroy', () => {
    const __dirname = to_dirname(import.meta.url);
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
