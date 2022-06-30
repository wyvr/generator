import { deepStrictEqual, strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { join } from 'path';
import { EnvType } from '../../../src/struc/env.js';
import { build } from '../../../src/utils/build.js';
import { read, write } from '../../../src/utils/file.js';
import { to_dirname, to_plain } from '../../../src/utils/to.js';
import { Cwd } from '../../../src/vars/cwd.js';
import { Env } from '../../../src/vars/env.js';

describe('utils/build/build', () => {
    let log = [];
    let console_error;
    const __dirname = join(to_dirname(import.meta.url), '_tests');
    before(() => {
        Cwd.set(__dirname);
        Env.set(EnvType.dev);
        console_error = console.error;
        console.error = (...values) => {
            log.push(values.map(to_plain));
        };
    });
    afterEach(() => {
        log = [];
    });
    after(() => {
        log = [];
        console_error = console.error;
        Cwd.set(undefined);
        Env.set(EnvType.prod);
    });

    it('undefined', async () => {
        strictEqual(await build(), undefined);
    });
    it('undefined', async () => {
        const content = read(join(__dirname, 'single.js'))
            .replace(/\[cwd\]/g, __dirname)
            .replace(/\[root\]/g, process.cwd());
            const result = await build(content, 'single.js');
        strictEqual(result.indexOf('document.querySelectorAll(\'[data-hydrate="file"]\')') > -1, true, 'contains selector');
        strictEqual(result.indexOf('@import') == -1, true, 'should not contain @import');
    });
});
