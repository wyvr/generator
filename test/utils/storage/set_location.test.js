import { strictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { join } from 'node:path';
import { Storage } from '../../../src/utils/storage.js';
import { to_dirname } from '../../../src/utils/to.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/storage/set_location', () => {
    const __dirname = to_dirname(import.meta.url);
    const __root = join(__dirname, '..' , '..', '..');

    before(() => {
        Cwd.set(__root);
    });
    after(() => {
        Cwd.set(undefined);
    });

    it('undefined', () => {
        strictEqual(Storage.set_location(), undefined);
    });
    it('undefined', () => {
        strictEqual(Storage.set_location('test'), join(__root, 'test'));
    });
});
