import { strictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { create_hash } from '../../../src/utils/hash.js';

describe('utils/hash/create_hash', () => {
    it('undefined', () => {
        const result = create_hash();
        strictEqual(result, '0x0');
    });
    it('empty', () => {
        const result = create_hash('');
        strictEqual(result, '0x0');
    });
    it('has values', () => {
        const result = create_hash('#');
        strictEqual(result.length, 16, 'length of hash');
    });
    it('limit length', () => {
        const result = create_hash('#', 5);
        strictEqual(result.length, 5, 'length of hash');
    });
    it('invalid limit length', () => {
        const result = create_hash('#', 'a');
        strictEqual(result.length, 16, 'length of hash');
    });
});
