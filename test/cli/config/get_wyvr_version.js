import { deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { get_wyvr_version } from '../../../src/cli/config.js';

describe('cli/config/get_wyvr_version', () => {
    
    it('version', () => {
        deepStrictEqual(get_wyvr_version(), '0.0.0');
    });
});
