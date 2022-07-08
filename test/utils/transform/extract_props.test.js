import { deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { join } from 'path';
import { to_dirname } from '../../../src/utils/to.js';
import { extract_props } from '../../../src/utils/transform.js';

describe('utils/transform/extract_props', () => {
    const __dirname = join(to_dirname(import.meta.url), '_tests', 'combine_splits');

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
