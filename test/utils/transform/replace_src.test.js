import { strictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { join } from 'node:path';
import { to_dirname } from '../../../src/utils/to.js';
import { replace_src } from '../../../src/utils/transform.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/transform/replace_src', () => {
    const __dirname = join(to_dirname(import.meta.url), '..', '..', '..');
    const cwd = process.cwd();
    before(() => {
        Cwd.set(process.cwd());
    });
    after(() => {
        Cwd.set(undefined);
    });
    it('undefined', () => {
        strictEqual(replace_src(), '');
    });
    it('content without to', () => {
        strictEqual(replace_src(`@src/some/src/file.css`), `@src/some/src/file.css`);
    });
    it('content empty to', () => {
        strictEqual(replace_src(`@src/some/src/file.css`, ''), `some/src/file.css`);
    });
    it('content', () => {
        strictEqual(replace_src(`@src/some/src/file.css`, 'huhu/'), `huhu/some/src/file.css`);
    });
    it('content with extension', () => {
        strictEqual(replace_src(`@src/some/src/file.css`, 'huhu/', 'css'), `huhu/some/src/file.css`);
    });
});
