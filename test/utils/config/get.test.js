import { deepStrictEqual, strictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { Config } from '../../../src/utils/config.js';
import { Cwd } from '../../../src/vars/cwd.js';


describe('utils/config/get', () => {
    const cwd = Cwd.get();
    afterEach(() => {
        Cwd.set(cwd);
    });

    it('load config', () => {
        const config = Config.get();
        deepStrictEqual(config, {});
    });
    it('load segment', () => {
        const config = Config.get('worker.ratio', 1);
        deepStrictEqual(config, 1);
    });
});
