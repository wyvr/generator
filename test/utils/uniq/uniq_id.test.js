import { strictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { uniq_id } from '../../../src/utils/uniq.js';

describe('utils/uniq/uniq_id', () => {
    it('check length', () => {
        const value = uniq_id();
        strictEqual(value.length, 32);
    });
});