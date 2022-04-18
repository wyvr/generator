import { deepStrictEqual, strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { search_segment } from '../../../src/utils/segment.js';

describe('utils/segment/search_segment', () => {
    const object = {
        key: 'value1',
        deep: {
            key: 'value2',
            list: [0, 1, 2, 3],
            deep_list: [{ key: 'value3' }, { key: 'value4' }],
        },
    };

    it('undefined', () => {
        strictEqual(search_segment(), undefined);
    });
    it('search in undefined', () => {
        strictEqual(search_segment(undefined, 'key'), undefined);
    });
    it('search deep in undefined', () => {
        strictEqual(search_segment(undefined, 'deep.key'), undefined);
    });
    it('different fallback value', () => {
        strictEqual(search_segment(undefined, 'deep.key', false), false);
    });
    it('search in object', () => {
        strictEqual(search_segment(object, 'key'), 'value1');
    });
    it('search deep in object', () => {
        strictEqual(search_segment(object, 'deep.key'), 'value2');
    });
    it('not found in object', () => {
        strictEqual(search_segment(object, 'notfound'), undefined);
    });
    it('not found in array', () => {
        strictEqual(search_segment(object, 'deep.deep_list.key'), undefined);
    });
});
