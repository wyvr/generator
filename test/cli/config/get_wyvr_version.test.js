import { ok } from 'node:assert';
import { describe, it } from 'mocha';
import { get_wyvr_version } from '../../../src/cli/config.js';

describe('cli/config/get_wyvr_version', () => {
    
    it('version', () => {
        ok(get_wyvr_version());
    });
});
