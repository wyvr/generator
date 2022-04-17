import { deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { Config } from '../../../src/utils/config.js';

describe('utils/config/set', () => {
    const original = Config.get();

    afterEach(() => {
        Config.replace(original);
    });

    it('undefined', () => {
        Config.replace(undefined);
        deepStrictEqual(Config.get(), original);
    });
    it('value', () => {
        Config.replace({
            key: 'value',
        });
        deepStrictEqual(Config.get(), {
            key: 'value',
        });
    });
});
