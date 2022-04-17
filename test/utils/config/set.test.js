import { deepStrictEqual, strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { Config } from '../../../src/utils/config.js';
import { WyvrConfig } from '../../../src/model/wyvr_config.js';

describe('utils/config/set', () => {
    const original = Config.get();

    beforeEach(() => {
        Config.replace({ key: 'value' });
    });
    afterEach(() => {
        Config.replace(original);
    });

    it('undefined', () => {
        Config.set('key', undefined);
        deepStrictEqual(Config.get(), { key: undefined });
    });
    it('value', () => {
        Config.set('key', 'true');
        deepStrictEqual(Config.get(), { key: 'true' });
    });
    it('create', () => {
        Config.set('new_key', 'true');
        deepStrictEqual(Config.get(), { key: 'value', new_key: 'true' });
    });
    it('create deep', () => {
        Config.set('new_key.test', 'true');
        deepStrictEqual(Config.get(), { key: 'value', new_key: { test: 'true' } });
    });
    it('when empty', () => {
        Config.replace(undefined);
        Config.set('key', 'value');
        const result = Object.assign({}, WyvrConfig, { key: 'value' });
        deepStrictEqual(Config.get(), result);
    });
});
