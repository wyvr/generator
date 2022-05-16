import { deepStrictEqual, strictEqual } from 'assert';
import { readFileSync } from 'fs';
import { describe, it } from 'mocha';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { extract_and_load_split } from '../../../src/utils/transform.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/transform/extract_and_load_split', () => {
    const __dirname = join(dirname(resolve(join(fileURLToPath(import.meta.url)))), '_tests', 'combine_splits');
    before(()=>{
        Cwd.set(join(__dirname, '..', '..', '..'))
    })
    after(()=>{
        Cwd.set(undefined)
    })
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
});
