import { strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { create_hash} from '../../../src/utils/hash.js';

describe('utils/hash/create_hash', () => {
    it('undefined', () => {
        const result = create_hash();
        strictEqual(result, '');
    });
    it('has values', () => {
        const result = create_hash('#');
        strictEqual(result.length, 8, 'length of hash');
    });
});
