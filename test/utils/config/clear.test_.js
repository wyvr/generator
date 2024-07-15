import { deepStrictEqual, strictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { Config } from '../../../src/utils/config.js';
import { Cwd } from '../../../src/vars/cwd.js';


describe('utils/config/clear', () => {
    const cwd = Cwd.get();
    const __dirname = to_dirname(import.meta.url);

    afterEach(() => {
        Cwd.set(cwd);
    });

    it('clear non existing config', async () => {
        Cwd.set(join(__dirname, '_tests/empty/'));
        Config.clear();
        deepStrictEqual(config, { url: 'simple' });
    });
});
