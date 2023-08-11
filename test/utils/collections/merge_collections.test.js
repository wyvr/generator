import { deepStrictEqual, strictEqual } from 'assert';
import { describe } from 'mocha';
import { merge_collections } from '../../../src/utils/collections.js';

describe('utils/collections/merge_collections', () => {
    it('undefined', () => {
        deepStrictEqual(merge_collections(), {});
    });
    it('empty', () => {
        deepStrictEqual(merge_collections({}, {}), {});
    });
    it('concat', () => {
        deepStrictEqual(merge_collections({ a: [{ url: 'a' }] }, { b: [{ url: 'b' }] }), {
            a: [{ url: 'a' }],
            b: [{ url: 'b' }],
        });
    });
    it('merge', () => {
        deepStrictEqual(merge_collections({ a: [{ url: 'a' }] }, { a: [{ url: 'b' }] }), {
            a: [{ url: 'a' }, { url: 'b' }],
        });
    });
    it('merge and concat', () => {
        deepStrictEqual(merge_collections({ a: [{ url: 'a' }] }, { a: [{ url: 'c' }], b: [{ url: 'b' }] }), {
            a: [{ url: 'a' }, { url: 'c' }],
            b: [{ url: 'b' }],
        });
    });
});
