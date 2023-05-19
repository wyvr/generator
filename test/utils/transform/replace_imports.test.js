import { strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { join } from 'path';
import { to_dirname } from '../../../src/utils/to.js';
import { replace_imports } from '../../../src/utils/transform.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/transform/replace_imports', () => {
    const __dirname = join(to_dirname(import.meta.url), '..', '..', '..');
    const cwd = process.cwd();
    before(() => {
        Cwd.set(process.cwd());
    });
    after(() => {
        Cwd.set(undefined);
    });
    it('undefined', () => {
        strictEqual(replace_imports(), '');
    });
});
