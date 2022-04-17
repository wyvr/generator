import { strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { uniq } from '../../../src/utils/uniq.js';

describe('utils/uniq/uniq', () => {
    it('check length', () => {
        const value = uniq();
        strictEqual(value.length, 32);
    });
});