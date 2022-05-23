import { deepStrictEqual, strictEqual } from 'assert';
import { readFileSync } from 'fs';
import { describe, it } from 'mocha';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { read } from '../../../src/utils/file.js';
import { extract_and_load_split } from '../../../src/utils/transform.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/transform/extract_and_load_split', () => {
    const cwd = process.cwd();
    const __dirname = join(dirname(resolve(join(fileURLToPath(import.meta.url)))), '_tests', 'combine_splits');
    before(() => {
        Cwd.set(__dirname);
    });
    after(() => {
        Cwd.set(undefined);
    });
    it('undefined', async () => {
        deepStrictEqual(await extract_and_load_split(), {
            path: undefined,
            content: '',
            tag: undefined,
            tags: [],
            loaded_file: undefined,
            loaded_content: undefined,
        });
    });
    it('only path', async () => {
        const path = join(__dirname, 'empty.svelte');
        deepStrictEqual(await extract_and_load_split(path), {
            path,
            content: '',
            tag: undefined,
            tags: [],
            loaded_file: undefined,
            loaded_content: undefined,
        });
    });
    it('path and content', async () => {
        const path = join(__dirname, 'empty.svelte');
        deepStrictEqual(await extract_and_load_split(path, 'test<style>.b {color:blue;}</style>'), {
            path,
            content: 'test<style>.b {color:blue;}</style>',
            tag: undefined,
            tags: [],
            loaded_file: undefined,
            loaded_content: undefined,
        });
    });
    it('path, content and tag', async () => {
        const path = join(__dirname, 'empty.svelte');
        deepStrictEqual(await extract_and_load_split(path, 'test<style>.b {color:blue;}</style>', 'style'), {
            path,
            content: 'test',
            tag: 'style',
            tags: ['.b {color:blue;}'],
            loaded_file: undefined,
            loaded_content: undefined,
        });
    });
    it('path, content, tag and extensions', async () => {
        const path = join(__dirname, 'empty.svelte');
        deepStrictEqual(await extract_and_load_split(path, 'test<style>.b {color:blue;}</style>', 'style', ['css']), {
            path,
            content: 'test',
            tag: 'style',
            tags: ['.b {color:blue;}'],
            loaded_file: join(__dirname, 'empty.css'),
            loaded_content: `.empty {
    color: red;
}
`,
        });
    });
    it('compile SASS', async () => {
        const path = join(__dirname, 'scss.svelte');

        deepStrictEqual(await extract_and_load_split(path, 'test', 'style', ['css', 'scss']), {
            path,
            content: 'test',
            tag: 'style',
            tags: [],
            loaded_file: join(__dirname, 'scss.scss'),
            loaded_content: `.a {
  color: red;
}`,
        });
    });
    it('compile SASS in style with type="text/scss"', async () => {
        const path = join(__dirname, 'scss_type.svelte');

        deepStrictEqual(await extract_and_load_split(path, read(path), 'style', ['css', 'scss']), {
            path,
            content: '<div class="a">test</div>\n\n\n',
            tag: 'style',
            tags: [
                `.a {
  color: red;
}`,
            ],
            loaded_file: undefined,
            loaded_content: undefined,
        });
    });
    it('compile SASS in style with lang="sass"', async () => {
        const path = join(__dirname, 'scss_lang.svelte');

        deepStrictEqual(await extract_and_load_split(path, read(path), 'style', ['css', 'scss']), {
            path,
            content: '<div class="a">test</div>\n\n\n',
            tag: 'style',
            tags: [
                `.a {
  color: red;
}`,
            ],
            loaded_file: undefined,
            loaded_content: undefined,
        });
    });
    it('compile SASS inline tag and loaded', async () => {
        const path = join(__dirname, 'scss_complete.svelte');

        deepStrictEqual(await extract_and_load_split(path, read(path), 'style', ['css', 'scss']), {
            path,
            content: '<div class="a b">test</div>\n\n\n',
            tag: 'style',
            tags: [
                `.a {
  color: red;
}`,
            ],
            loaded_file: join(__dirname, 'scss_complete.scss'),
            loaded_content: `.b {
  color: blue;
}`,
        });
    });
    it('replace @src in inline SASS', async () => {
        const path = join(__dirname, 'scss_inline_import.svelte');

        deepStrictEqual(await extract_and_load_split(path, read(path), 'style', ['css', 'scss']), {
            content:
                '<script>\n' +
                '</script>\n' +
                '\n' +
                '<code>\n' +
                '    <button>Button with SASS Syntax</button>\n' +
                '</code>\n' +
                '\n' +
                '\n',
            loaded_content: undefined,
            loaded_file: undefined,
            path: cwd + '/test/utils/transform/_tests/combine_splits/scss_inline_import.svelte',
            tag: 'style',
            tags: [
                'a {\n  color: red;\n}\n\ncode {\n' +
                    '  display: block;\n' +
                    '}\n' +
                    '\n' +
                    'button {\n' +
                    '  border: 2px solid #7c5ed0;\n' +
                    '  background: transparent;\n' +
                    '  padding: 10px;\n' +
                    '  font-size: 16px;\n' +
                    '  color: #7c5ed0;\n' +
                    '}',
            ],
        });
    });
    it('error compile SASS', async () => {
        const path = join(__dirname, 'error_scss.svelte');

        deepStrictEqual(await extract_and_load_split(path, 'test', 'style', ['css', 'scss']), {
            path,
            content: 'test',
            tag: 'style',
            tags: [],
            loaded_file: join(__dirname, 'error_scss.scss'),
            loaded_content: undefined,
        });
    });
    it('compile TypeScript', async () => {
        const path = join(__dirname, 'ts.svelte');

        deepStrictEqual(await extract_and_load_split(path, 'test', 'script', ['js', 'ts']), {
            path,
            content: 'test',
            tag: 'script',
            tags: [],
            loaded_file: join(__dirname, 'ts.ts'),
            loaded_content: `function add(left, right) {\n  return left + right;\n}\n`,
        });
    });

    it('compile TypeScript in script with lang="ts"', async () => {
        const path = join(__dirname, 'ts_lang.svelte');

        deepStrictEqual(await extract_and_load_split(path, read(path), 'script', ['js', 'ts']), {
            path,
            content: '\n\n<div class="a">test</div>\n',
            tag: 'script',
            tags: [`function add(left, right) {\n  return left + right;\n}\n`],
            loaded_file: undefined,
            loaded_content: undefined,
        });
    });
    it('compile TypeScript inline tag and loaded', async () => {
        const path = join(__dirname, 'ts_complete.svelte');

        deepStrictEqual(await extract_and_load_split(path, read(path), 'script', ['js', 'ts']), {
            path,
            content: '\n\n<div class="a">test</div>\n',
            tag: 'script',
            tags: [`function add(left, right) {\n  return left + right;\n}\n`],
            loaded_file: join(__dirname, 'ts_complete.ts'),
            loaded_content: `function remove(left, right) {\n  return left - right;\n}\n`,
        });
    });
    it('error compile TypeScript', async () => {
        const path = join(__dirname, 'error_ts.svelte');

        deepStrictEqual(await extract_and_load_split(path, 'test', 'script', ['js', 'ts']), {
            path,
            content: 'test',
            tag: 'script',
            tags: [],
            loaded_file: join(__dirname, 'error_ts.ts'),
            loaded_content: undefined,
        });
    });
});
