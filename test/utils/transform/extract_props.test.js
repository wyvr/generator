import { deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { extract_props } from '../../../src/utils/transform.js';

describe('utils/transform/extract_props', () => {
    it('undefined', async () => {
        deepStrictEqual(extract_props(), []);
    });
    it('string', async () => {
        deepStrictEqual(extract_props(`export let value=0;`), ['value']);
    });
    it('empty', async () => {
        deepStrictEqual(extract_props(''), []);
    });
});
