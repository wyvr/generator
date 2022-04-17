import { strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { ERRORS } from '../../../src/constants/errors.js';

describe('constants/error/missing', () => {
    it('undefined', () => {
        strictEqual(ERRORS.missing(), '"[something]" is missing');
    });
    it('true', () => {
        strictEqual(ERRORS.missing(), '"[something]" is missing');
    });
    it('false', () => {
        strictEqual(ERRORS.missing(), '"[something]" is missing');
    });
    it('value', () => {
        strictEqual(ERRORS.missing('value'), '"value" is missing');
    });
});
