import { deepStrictEqual, strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { join } from 'path';
import { compile_server_svelte } from '../../../src/utils/compile.js';
import { read, write } from '../../../src/utils/file.js';
import { to_dirname, to_plain } from '../../../src/utils/to.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/to/compile_server_svelte', () => {
    let log = [];
    let console_error;
    const cwd = process.cwd();
    const __dirname = join(to_dirname(import.meta.url), '..', 'compile', '_tests', 'server_svelte');
    beforeEach(() => {
        Cwd.set(__dirname);
        console_error = console.error;
        console.error = (...values) => {
            log.push(values.map(to_plain));
        };
    });
    afterEach(() => {
        log = [];
        console_error = console.error;
        Cwd.set(undefined);
    });

    it('undefined', async () => {
        strictEqual(await compile_server_svelte(), undefined);
        deepStrictEqual(log, []);
    });
    it('simple', async () => {
        const file = join(__dirname, 'Simple.svelte');
        const content = read(file).replace(/\[root\]/g, process.cwd());
        const result = await compile_server_svelte(content, file);
        deepStrictEqual(log, []);
        strictEqual(result != undefined, true, 'nothing got compiled')
        deepStrictEqual(Object.keys(result), ['compiled', 'component', 'result']);
        deepStrictEqual(Object.keys(result.compiled), ['js', 'css', 'ast', 'warnings', 'vars', 'stats']);
        deepStrictEqual(Object.keys(result.component), ['render', '$$render']);
        const rendered = result.component.render();
        deepStrictEqual(rendered.html, 'Hello /url');
    });
    // it('page with imports', async () => {
    //     const content = read(join(__dirname, 'Page.svelte')).replace(/\[root\]/g, process.cwd());
    //     const result = await compile_server_svelte(content);
    //     deepStrictEqual(log, []);
    //     deepStrictEqual(Object.keys(result), ['compiled', 'component', 'result', 'notes']);
    //     deepStrictEqual(Object.keys(result.compiled), ['js', 'css', 'ast', 'warnings', 'vars', 'stats']);
    //     deepStrictEqual(Object.keys(result.component), ['render', '$$render']);
    //     const rendered = await result.component.render();
    //     deepStrictEqual(rendered.html, 'hello');
    // });
});
