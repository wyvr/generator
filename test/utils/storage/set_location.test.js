import { strictEqual, deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { Storage } from '../../../src/utils/storage.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/storage/set_location', () => {
    const __dirname = dirname(resolve(join(fileURLToPath(import.meta.url))));
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
