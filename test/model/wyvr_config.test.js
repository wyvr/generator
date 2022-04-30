import { deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { WyvrConfig } from '../../src/model/wyvr_config.js';

describe('model/wyvr_config', () => {
    it('default values', () => {
        deepStrictEqual(Object.keys(WyvrConfig), [
            'url',
            'worker',
            'releases',
            'packages',
            'assets',
            'default_values',
            'cron',
            'https'
        ]);
    });
});
