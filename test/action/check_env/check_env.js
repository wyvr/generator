import { strictEqual, deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { Cwd } from '../../../src/vars/cwd.js';
import { check_env } from '../../../src/action/check_env.js';
import { ERRORS } from '../../../src/constants/errors.js';

describe('action/check_env/check_env', () => {
    const cwd = Cwd.get();
    const __dirname = dirname(resolve(join(fileURLToPath(import.meta.url))));
    const __root = resolve(join(__dirname, '..', '..', '..'));

    afterEach(()=> {
        Cwd.set(cwd);
    })
    it('error run in same folder', async () => {
        Cwd.set(__root);
        const report = await check_env();
        strictEqual(report.success, false);
        strictEqual(report.error.indexOf(ERRORS.run_in_same_folder) > -1, true);
    });
    it('empty folder', async () => {
        Cwd.set(join(__dirname, '_tests', 'empty'));
        const report = await check_env();
        strictEqual(report.success, true);
        strictEqual(report.warning.indexOf(ERRORS.package_is_not_present) > -1, true);
    });
    it('invalid folder', async () => {
        Cwd.set(join(__dirname, '_tests', 'invalid'));
        const report = await check_env();
        strictEqual(report.success, true);
        strictEqual(report.warning.indexOf(ERRORS.package_is_not_valid) > -1, true);
    });
});
