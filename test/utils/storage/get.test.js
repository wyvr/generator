import { strictEqual, deepStrictEqual } from 'assert';
import { existsSync, mkdirSync, rmdirSync, unlinkSync, writeFileSync } from 'fs';
import { describe, it } from 'mocha';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { Storage } from '../../../src/utils/storage.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/storage/get', () => {
    const __dirname = dirname(resolve(join(fileURLToPath(import.meta.url))));
    const __root = join(__dirname, '..', '..', '..');
    const __path = join('test', 'utils', 'storage', '_tests', 'get');
    const test_folder = join(__root, __path);

    before(async () => {
        Cwd.set(__root);
        Storage.set_location(__path);
        await Storage.open('test_get');
        await Storage.cache['test_get'].run('INSERT INTO "data" (key, value) VALUES (?, ?);', 'key', '"value"');
    });
    after(() => {
        Storage.location = undefined;
        Cwd.set(undefined);
        if (existsSync(test_folder)) {
            rmdirSync(test_folder, { recursive: true, force: true });
        }
        Storage.cache = {};
    });
    it('undefined', async () => {
        deepStrictEqual(await Storage.get(), undefined);
    });
    it('missing key or data', async () => {
        deepStrictEqual(await Storage.get('test_get'), undefined);
    });
    it('get value', async () => {
        deepStrictEqual(await Storage.get('test_get', 'key'), 'value');
    });
    it('unknown key', async () => {
        deepStrictEqual(await Storage.get('test_get', 'unknown'), undefined);
    });
    it('unknown database', async () => {
        deepStrictEqual(await Storage.get('test_get_unknown', 'unknown'), undefined);
    });
});
