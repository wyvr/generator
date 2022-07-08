import { deepStrictEqual, strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { inject, Config } from '../../../src/utils/config.js';
import { WyvrConfig } from '../../../src/model/wyvr_config.js';
import { Cwd } from '../../../src/vars/cwd.js';
import { to_dirname } from '../../../src/utils/to.js';
import { join } from 'path';

describe('utils/config/set', () => {
    let error;

    before(() => {
        Cwd.set(join(to_dirname(import.meta.url), '_tests', 'inject'));
    });
    afterEach(() => {
        error = undefined;
        delete global._inject;
        delete global._inject_file;
    });
    after(() => {
        Cwd.set(undefined);
    });

    it('undefined', async () => {
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
        let result;
        try {
            result = await inject('', 'file');
        } catch (e) {
            error = e;
        }
        deepStrictEqual(result, '');
        deepStrictEqual(error, undefined);
    });
    it('nothing to inject', async () => {
        let result;
        try {
            result = await inject('test', 'file');
        } catch (e) {
            error = e;
        }
        deepStrictEqual(result, 'test');
        deepStrictEqual(error, undefined);
    });
    it('avoid inject', async () => {
        let result;
        try {
            result = await inject('test_inject(true)', 'file');
        } catch (e) {
            error = e;
        }
        deepStrictEqual(result, 'test_inject(true)');
        deepStrictEqual(error, undefined);
    });
    it('inject after avoid inject', async () => {
        let result;
        try {
            result = await inject(`test_inject(true) _inject('key.key', false)`, 'file');
        } catch (e) {
            error = e;
        }
        deepStrictEqual(result, 'test_inject(true) "value"');
        deepStrictEqual(error, undefined);
    });
    it('inject value', async () => {
        let result;
        try {
            result = await inject(`<div>{_inject('key.key', false)}</div>`, 'file');
        } catch (e) {
            error = e;
        }
        deepStrictEqual(result, `<div>{"value"}</div>`);
        deepStrictEqual(error, undefined);
    });
    it('missing close', async () => {
        let result;
        try {
            result = await inject(`<div>{_inject('key.key', false}</div>`, 'file');
        } catch (e) {
            error = e;
        }
        deepStrictEqual(result, `<div>{_inject('key.key', false}</div>`);
        deepStrictEqual(error, undefined);
    });
    it('inject fallback', async () => {
        let result;
        try {
            result = await inject(`<div>{_inject('unknown', false)}</div>`, 'file');
        } catch (e) {
            error = e;
        }
        deepStrictEqual(result, `<div>{false}</div>`);
        deepStrictEqual(error, undefined);
    });
    it('inject callback', async () => {
        let result;
        try {
            result = await inject(`<div>{_inject('unknown', false, (value) => !value)}</div>`, 'file');
        } catch (e) {
            error = e;
        }
        deepStrictEqual(result, `<div>{true}</div>`);
        deepStrictEqual(error, undefined);
    });
});
