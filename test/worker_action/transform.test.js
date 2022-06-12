import { deepStrictEqual, strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { transform } from '../../src/worker_action/transform.js';
import { Cwd } from '../../src/vars/cwd.js';
import { join } from 'path';
import { copyFileSync } from 'fs';
import { collect_files, copy, exists, read, remove } from '../../src/utils/file.js';
import { FOLDER_GEN_CLIENT, FOLDER_GEN_SERVER, FOLDER_GEN_SRC } from '../../src/constants/folder.js';

describe('worker_action/transform', () => {
    let logger_messages = [];
    const path = join(process.cwd(), 'test', 'worker_action', '_tests', 'transform');
    before(() => {
        Cwd.set(path);
        // remove(join(path, '_simple'));
    });
    beforeEach(() => {});
    afterEach(() => {
        logger_messages = [];
    });
    after(() => {
        Cwd.set(undefined);
    });

    it('undefined', async () => {
        strictEqual(await transform(), false);
    });
    it('empty list', async () => {
        strictEqual(await transform([]), false);
    });
});
