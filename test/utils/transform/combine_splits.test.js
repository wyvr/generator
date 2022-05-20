import { deepStrictEqual, strictEqual } from 'assert';
import { readFileSync } from 'fs';
import { describe, it } from 'mocha';
import { join } from 'path';
import { to_dirname } from '../../../src/utils/to.js';
import { combine_splits } from '../../../src/utils/transform.js';

describe('utils/transform/combine_splits', () => {
    const __dirname = join(to_dirname(import.meta.url), '_tests', 'combine_splits');

    it('undefined', async () => {
        deepStrictEqual(await combine_splits(), {
            path: '',
            content: '',
            css: undefined,
            js: undefined,
        });
    });
    it('files but undefined content', async () => {
        const path = join(__dirname, 'empty.svelte');
        deepStrictEqual(await combine_splits(path), {
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
    it('combine multiple tags', async () => {
        const path = join(__dirname, 'multiple.svelte');
        const content = readFileSync(path, { encoding: 'utf-8' });
        deepStrictEqual(await combine_splits(path, content), {
            path,
            content: `<script>
    const a = b(1);
function b(v) {
    return v;
}</script>

<div class="a b">{a}</div>


<style>.b {
    text-decoration: underline;
}
    .a {
        color: red;
    }
</style>`,
            css: join(__dirname, 'multiple.css'),
            js: join(__dirname, 'multiple.js'),
        });
    });
    it('scss combine', async () => {
        const path = join(__dirname, 'scss.svelte');
        const content = readFileSync(path, { encoding: 'utf-8' });
        deepStrictEqual(await combine_splits(path, content), {
            path,
            content: `<div class="a">test</div><style>.a {
  color: red;
}</style>`,
            css: join(__dirname, 'scss.scss'),
            js: undefined,
        });
    });
    it('css and scss available', async () => {
        const path = join(__dirname, 'css_scss.svelte');
        const content = readFileSync(path, { encoding: 'utf-8' });
        deepStrictEqual(await combine_splits(path, content), {
            path,
            content: `<div class="a">test</div><style>.a {
    color: red;
}</style>`,
            css: join(__dirname, 'css_scss.css'),
            js: undefined,
        });
    });
});
