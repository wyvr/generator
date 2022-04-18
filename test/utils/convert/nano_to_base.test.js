import { strictEqual } from 'assert';
import { describe } from 'mocha';
import { nano_to_base } from '../../../src/utils/convert.js';

describe('utils/convert/nano_to_base', () => {
    it('undefined', () => {
        strictEqual(nano_to_base(), undefined);
    });
    it('number', () => {
        strictEqual(nano_to_base(10000000000), 10);
    });
    it('Number.MAX_SAFE_INTEGER', () => {
        strictEqual(nano_to_base(BigInt(Number.MAX_SAFE_INTEGER)), 9007199);
    });
});
