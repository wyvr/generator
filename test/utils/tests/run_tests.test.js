import { deepStrictEqual, strictEqual } from 'node:assert';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { describe, it } from 'mocha';
import { join } from 'node:path';
import Sinon from 'sinon';
import { run_tests } from '../../../src/utils/tests.js';
import { Logger } from '../../../src/utils/logger.js';
import { to_dirname } from '../../../src/utils/to.js';
import { Cwd } from '../../../src/vars/cwd.js';
import { UniqId } from '../../../src/vars/uniq_id.js';

describe('utils/tests/run_tests', () => {
    it('no files given', async () => {
        const files = [];

        const result = await run_tests(files);

        strictEqual(result, undefined);
    });
});
