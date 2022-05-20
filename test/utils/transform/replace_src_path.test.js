import { strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { replace_src_path } from '../../../src/utils/transform.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/transform/replace_src_path', () => {
    const __dirname = dirname(resolve(join(fileURLToPath(import.meta.url), '..', '..', '..')));
    const cwd = process.cwd();
    before(() => {
        Cwd.set(process.cwd());
    });
    after(() => {
        Cwd.set(undefined);
    });
    it('undefined', () => {
        strictEqual(replace_src_path(), undefined);
    });
    it('content without to', () => {
        strictEqual(replace_src_path(`@import '@src/some/src/file.css';`), `@import '@src/some/src/file.css';`);
    });
    it('content', () => {
        strictEqual(replace_src_path(`@import '@src/some/src/file.css';`, 'to'), `@import '${cwd}/to/some/src/file.css';`);
    });
    it('content with extension', () => {
        strictEqual(replace_src_path(`@import '@src/some/src/file.css';`, 'to', 'css'), `@import '${cwd}/to/some/src/file.css';`);
    });
    it('svelte content, only inside script and style tags', () => {
        strictEqual(replace_src_path(`<script>import * from '@src/some/src/file.css';</script><p>import '@src/some/src/file.css';</p><style>@import '@src/some/src/file.css';</style>`, 'to', 'svelte'), `<script>import * from '${cwd}/to/some/src/file.css';</script><p>import '@src/some/src/file.css';</p><style>@import '${cwd}/to/some/src/file.css';</style>`);
    });
});
