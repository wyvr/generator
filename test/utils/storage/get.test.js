import { deepStrictEqual } from 'assert';
import { existsSync, rmSync } from 'fs';
import { describe, it } from 'mocha';
import { join } from 'path';
import Sinon from 'sinon';
import { Logger } from '../../../src/utils/logger.js';
import { Storage } from '../../../src/utils/storage.js';
import { to_dirname, to_plain } from '../../../src/utils/to.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/storage/get', () => {
    const __dirname = to_dirname(import.meta.url);
    const __root = join(__dirname, '..', '..', '..');
    const __path = join('test', 'utils', 'storage', '_tests', 'get');
    const test_folder = join(__root, __path);
    let log = [];

    before(async () => {
        Cwd.set(__root);
        Storage.set_location(__path);
        await Storage.open('test_get');
        await Storage.cache['test_get'].run('INSERT INTO "data" (key, value) VALUES (?, ?);', 'key', '"value"');
        Sinon.stub(Logger, 'output');
        Logger.output.callsFake((...msg) => {
            log.push(msg.map(to_plain));
        });
    });
    afterEach(() => {
        log = [];
    });
    after(() => {
        Storage.location = undefined;
        Cwd.set(undefined);
        if (existsSync(test_folder)) {
            rmSync(test_folder, { recursive: true, force: true });
        }
        Storage.cache = {};
        Logger.output.restore();
    });
    it('undefined', async () => {
        deepStrictEqual(await Storage.get(), undefined);
        deepStrictEqual(log, []);
    });
    it('missing key or data', async () => {
        deepStrictEqual(await Storage.get('test_get'), undefined);
        deepStrictEqual(log, []);
    });
    it('get value', async () => {
        deepStrictEqual(await Storage.get('test_get', 'key'), 'value');
        deepStrictEqual(log, []);
    });
    it('unknown key', async () => {
        deepStrictEqual(await Storage.get('test_get', 'unknown'), undefined);
        deepStrictEqual(log, []);
    });
    it('unknown database', async () => {
        deepStrictEqual(await Storage.get('test_get_unknown', 'unknown'), undefined);
        deepStrictEqual(log, []);
    });
    it('throw error', async () => {
        await Storage.open('test_get_error');
        await Storage.cache['test_get_error'].run('DROP TABLE "data";');
        deepStrictEqual(await Storage.get('test_get_error', 'key'), undefined);
        deepStrictEqual(log, [
            [
                '',
                '',
                '✖',
                '@storage\n' + '[Error] SQLITE_ERROR: no such table: data\n' + 'stack\n' + 'source test_get_error',
            ],
        ]);
    });
});
