import { strictEqual, deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { Cwd } from '../../../src/vars/cwd.js';
import { check_env } from '../../../src/action/check_env.js';
import { ERRORS } from '../../../src/constants/errors.js';

describe('action/check_env/check_env', () => {
    const cwd = Cwd.get();
    const __dirname = dirname(resolve(join(fileURLToPath(import.meta.url), '..', '..', '..')));

    afterEach(()=> {
        Cwd.set(cwd);
    })
    it('error run in same folder', async () => {
        Cwd.set(__dirname);
        const report = await check_env();
        strictEqual(report.success, false);
        strictEqual(report.error.indexOf(ERRORS.run_in_same_folder) > -1, true);
        
    });
});
