import { deepStrictEqual, strictEqual } from 'assert';
import { readFileSync } from 'fs';
import { describe, it } from 'mocha';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { combine_splits } from '../../../src/utils/transform.js';

describe('utils/transform/combine_splits', () => {
    const __dirname = join(dirname(resolve(join(fileURLToPath(import.meta.url)))), '_tests', 'combine_splits');

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
    it('combine multiple tags', () => {
        const path = join(__dirname, 'multiple.svelte');
        const content = readFileSync(path, { encoding: 'utf-8' });
        deepStrictEqual(combine_splits(path, content), {
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
    it('scss combine', () => {
        const path = join(__dirname, 'scss.svelte');
        const content = readFileSync(path, { encoding: 'utf-8' });
        deepStrictEqual(combine_splits(path, content), {
            path,
            content: `<div class="a">test</div><style>.a {
  color: red;
}</style>`,
            css: join(__dirname, 'scss.scss'),
            js: undefined,
        });
    });
    it('css and scss available', () => {
        const path = join(__dirname, 'css_scss.svelte');
        const content = readFileSync(path, { encoding: 'utf-8' });
        deepStrictEqual(combine_splits(path, content), {
            path,
            content: `<div class="a">test</div><style>.a {
    color: red;
}</style>`,
            css: join(__dirname, 'css_scss.css'),
            js: undefined,
        });
    });
});
