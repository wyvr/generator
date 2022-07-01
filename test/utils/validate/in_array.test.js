import { strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { in_array } from '../../../src/utils/validate.js';

describe('utils/validate/in_array', () => {
    it('undefined', () => {
        strictEqual(in_array(), false);
    });
    it('missing value', () => {
        strictEqual(in_array(['a']), false);
    });
    it('found value', () => {
        strictEqual(in_array(['a'], 'a'), true);
    });
    it('not found value', () => {
        strictEqual(in_array(['a'], 'b'), false);
    });
});
