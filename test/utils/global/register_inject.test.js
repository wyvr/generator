import { deepStrictEqual, strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { register_inject } from '../../../src/utils/global.js';
import { WyvrConfig } from '../../../src/model/wyvr_config.js';
import { Cwd } from '../../../src/vars/cwd.js';
import { to_dirname, to_plain } from '../../../src/utils/to.js';
import { join } from 'path';
import Sinon from 'sinon';
import { Logger } from '../../../src/utils/logger.js';

describe('utils/global/register_inject', () => {
    let log = [];
    let orig_log;
    before(() => {
        Cwd.set(join(to_dirname(import.meta.url), '_tests'));
    });
    beforeEach(() => {
        register_inject();
        orig_log = Logger.output;
        Logger.output = (...args) => {
            log.push(...args.map(to_plain));
        };
    });
    afterEach(() => {
        log = [];
        Logger.output = orig_log;
    });
    after(() => {
        delete global._inject;
        delete global._inject_file;
        Cwd.set(undefined);
    });

    it('undefined', async () => {
        let result;
        result = await _inject(undefined, false);
        deepStrictEqual(result, false);
    });
    it('empty key', async () => {
        let result;
        result = await _inject('', false);
        deepStrictEqual(result, false);
    });
    it('empty key with callback', async () => {
        let result;
        result = await _inject('', false, (value) => !value);
        deepStrictEqual(result, true);
    });
    it('value', async () => {
        let result;
        result = await _inject('key.key', false);
        deepStrictEqual(result, 'value');
    });
    it('value with callback', async () => {
        let result;
        result = await _inject('key.key', false, (text) => text.split('').reverse().join(''));
        deepStrictEqual(result, 'eulav');
    });
    it('fallback from unknown key', async () => {
        let result;
        result = await _inject('key.unknown', false);
        deepStrictEqual(result, false);
    });
    it('fallback from unknown key with callback', async () => {
        let result;
        result = await _inject('key.unknown', false, (value) => !value);
        deepStrictEqual(result, true);
    });
    it('error in callback', async () => {
        let result;
        result = await _inject(undefined, 'a', (value) => JSON.parse(value));
        deepStrictEqual(result, 'a');
        deepStrictEqual(log, ['', '', '⚠', '@inject\n[SyntaxError] Unexpected token a in JSON at position 0\nstack']);
    });
});
