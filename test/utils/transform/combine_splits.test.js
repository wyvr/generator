import { deepStrictEqual, strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { combine_splits } from '../../../src/utils/transform.js';

describe('utils/transform/combine_splits', () => {
    const __dirname = join(
        dirname(resolve(join(fileURLToPath(import.meta.url)))),
        '_tests',
        'combine_splits'
    );

    it('undefined', () => {
        deepStrictEqual(combine_splits(), {
            path: '',
            content: '',
            css: undefined,
            js: undefined,
        });
    });
    it('files but undefined content', () => {
        const path = join(__dirname, 'empty.svelte');
        deepStrictEqual(combine_splits(path), {
            path,
            content: `<script>function empty() {
    return null;
}</script><style>.empty {
    color: red;
}
</style>`,
            css: join(__dirname, 'empty.css'),
            js: join(__dirname, 'empty.js'),
        });
    });
});
