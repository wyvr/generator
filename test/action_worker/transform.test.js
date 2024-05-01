import { deepStrictEqual, strictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { transform } from '../../src/action_worker/transform.js';
import { Cwd } from '../../src/vars/cwd.js';
import { join } from 'node:path';
import { copyFileSync } from 'node:fs';
import { collect_files, copy, exists, read, remove } from '../../src/utils/file.js';
import { FOLDER_GEN_CLIENT, FOLDER_GEN_SERVER, FOLDER_GEN_SRC } from '../../src/constants/folder.js';

describe('action_worker/transform', () => {
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
