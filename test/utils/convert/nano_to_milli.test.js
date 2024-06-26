import { strictEqual } from 'node:assert';
import { describe } from 'mocha';
import { nano_to_milli } from '../../../src/utils/convert.js';

describe('utils/convert/nano_to_milli', () => {
    it('undefined', () => {
        strictEqual(nano_to_milli(), undefined);
    });
    it('number', () => {
        strictEqual(nano_to_milli(10000000), 10);
    });
    it('Number.MAX_SAFE_INTEGER', () => {
        strictEqual(nano_to_milli(BigInt(Number.MAX_SAFE_INTEGER)), 9007199254);
    });
});
