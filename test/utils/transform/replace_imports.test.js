import { strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { join } from 'path';
import { to_dirname } from '../../../src/utils/to.js';
import { replace_imports } from '../../../src/utils/transform.js';
import { Cwd } from '../../../src/vars/cwd.js';
import { FOLDER_GEN_SERVER } from '../../../src/constants/folder.js';

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
    it('singleline imports', () => {
        strictEqual(
            replace_imports(`import { get } from '@src/bla/bla.js';`, 'file.js', FOLDER_GEN_SERVER).replace(/\?\d+/g, ''),
            `import { get } from '${join(cwd, FOLDER_GEN_SERVER)}/bla/bla.js';`
        );
    });
    it('multiline imports', () => {
        strictEqual(
            replace_imports("import { \nget,\nset\n } from '@src/bla/bla.js';", 'file.js', FOLDER_GEN_SERVER).replace(/\?\d+/g, ''),
            `import { \nget,\nset\n } from '${join(cwd, FOLDER_GEN_SERVER)}/bla/bla.js';`
        );
    });
});
