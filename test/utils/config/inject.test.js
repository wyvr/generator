import { deepStrictEqual, strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { inject, Config } from '../../../src/utils/config.js';
import { WyvrConfig } from '../../../src/model/wyvr_config.js';
import { Cwd } from '../../../src/vars/cwd.js';
import { to_dirname } from '../../../src/utils/to.js';
import { join } from 'path';

describe('utils/config/set', () => {
    let error;
    const original = Config.get();

    before(() => {
        Cwd.set(join(to_dirname(import.meta.url), '_tests', 'inject'));
        Config.replace({ key: 'value' });
    });
    afterEach(() => {
        error = undefined;
        delete global._inject;
        delete global._inject_file;
    });
    after(() => {
        Config.replace(original);
        Cwd.set(undefined);
    });

    it('undefined', async () => {
        Config.set('key', undefined);
        let result;
        try {
            result = await inject();
        } catch (e) {
            error = e;
        }
        deepStrictEqual(result, '');
        deepStrictEqual(error, undefined);
    });
    it('empty content', async () => {
        Config.set('key', undefined);
        let result;
        try {
            result = await inject('', 'file');
        } catch (e) {
            error = e;
        }
        deepStrictEqual(result, '');
        deepStrictEqual(error, undefined);
    });
    it('inject value', async () => {
        Config.set('key', undefined);
        let result;
        try {
            result = await inject(`<div>{_inject('key', false)}</div>`, 'file');
        } catch (e) {
            error = e;
        }
        deepStrictEqual(result, `<div>{'value'}</div>`);
        deepStrictEqual(error, undefined);
    });
    it('inject fallback', async () => {
        Config.set('key', undefined);
        let result;
        try {
            result = await inject(`<div>{_inject('unknown', false)}</div>`, 'file');
        } catch (e) {
            error = e;
        }
        deepStrictEqual(result, `<div>{false}</div>`);
        deepStrictEqual(error, undefined);
    });
});
