import { strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { array_contains } from '../../../src/utils/validate.js';

describe('utils/validate/array_contains', () => {
    it('undefined', () => {
        strictEqual(array_contains(), false);
    });
    it('missing value', () => {
        strictEqual(array_contains(['a']), false);
    });
    it('found value', () => {
        strictEqual(array_contains(['a'], 'a'), true);
    });
    it('not found value', () => {
        strictEqual(array_contains(['a'], 'b'), false);
    });
});
