import { strictEqual, deepStrictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { join } from 'node:path';
import { Cwd } from '../../../src/vars/cwd.js';
import { get_report } from '../../../src/action/check_env.js';
import { ERRORS } from '../../../src/constants/errors.js';
import { to_dirname } from '../../../src/utils/to.js';

describe('action/check_env/get_report', () => {
    const cwd = Cwd.get();
    const __dirname = to_dirname(import.meta.url);
    const __root = join(__dirname, '..', '..', '..');

    afterEach(() => {
        Cwd.set(cwd);
    });
    after(() => {
        Cwd.set(undefined);
    });
    it('every', async () => {
        Cwd.set(join(__dirname, '_tests', 'simple'));
        const report = await get_report();
        deepStrictEqual(report.error, []);
    });
    it('error run in same folder', async () => {
        Cwd.set(__root);
        const report = await get_report();
        strictEqual(report.error.indexOf(ERRORS.run_in_same_folder) > -1, true);
    });
    it('missing package.json', async () => {
        Cwd.set(join(__dirname, '_tests', 'empty'));
        const report = await get_report();
        strictEqual(report.warning.indexOf(ERRORS.package_is_not_present) > -1, true);
    });
    it('invalid package.json', async () => {
        Cwd.set(join(__dirname, '_tests', 'invalid'));
        const report = await get_report();
        strictEqual(report.warning.indexOf(ERRORS.package_is_not_valid) > -1, true);
    });
    it('missing wyvr.js', async () => {
        Cwd.set(join(__dirname, '_tests', 'empty'));
        const report = await get_report();
        strictEqual(report.error.indexOf(ERRORS.wyvr_js_is_not_present) > -1, true);
    });
});
