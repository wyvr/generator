import { deepStrictEqual, strictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { join } from 'node:path';
import Sinon from 'sinon';
import { to_plain } from '../../../src/utils/to.js';
import { unwatch } from '../../../src/utils/watcher.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/watcher/unwatch', () => {
    it('no watcher defined', async () => {
        let resolved;
        try {
            resolved = await unwatch();
        } catch (e) {
            resolved = false;
        }
        deepStrictEqual(resolved, true);
    });
});
