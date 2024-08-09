import { deepStrictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { WyvrConfig } from '../../src/model/wyvr_config.js';

describe('model/wyvr_config', () => {
    it('default values', () => {
        deepStrictEqual(Object.keys(WyvrConfig), [
            'assets',
            'cron',
            'default_values',
            'env',
            'https',
            'i18n',
            'packages',
            'releases',
            'url',
            'worker',
            'critical',
            'optimize'
        ]);
    });
});
