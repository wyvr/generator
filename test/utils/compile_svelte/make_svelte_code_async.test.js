import { deepStrictEqual, strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { make_svelte_code_async } from '../../../src/utils/compile_svelte.js';
import { Cwd } from '../../../src/vars/cwd.js';
import { join } from 'path';
import { to_plain } from '../../../src/utils/to.js';
import Sinon from 'sinon';
import { Logger } from '../../../src/utils/logger.js';
import { read } from '../../../src/utils/file.js';
import { Env } from '../../../src/vars/env.js';
import { EnvType } from '../../../src/struc/env.js';

describe('utils/compile_svelte/make_svelte_code_async', () => {
    const path = join(process.cwd(), 'test', 'utils', 'compile_svelte', '_tests');
    before(() => {
        Cwd.set(path);
    });
    beforeEach(() => {});
    after(() => {
        Cwd.set(undefined);
    });

    it('undefined', async () => {
        deepStrictEqual(await make_svelte_code_async(), '');
    });
    it('missing template', async () => {
        const orig = read(Cwd.get('make_svelte_code_async/missing_orig.js'));
        const result = read(Cwd.get('make_svelte_code_async/missing_result.js')).replace(/\[root\]/g, Cwd.get());
        const async_code = await make_svelte_code_async(orig);
        deepStrictEqual(async_code, result);
    });
    it('simple', async () => {
        const orig = read(Cwd.get('make_svelte_code_async/simple_orig.js'));
        const result = read(Cwd.get('make_svelte_code_async/simple_result.js')).replace(/\[root\]/g, Cwd.get());
        const async_code = await make_svelte_code_async(orig);
        deepStrictEqual(async_code, result);
    });
    it('nested', async () => {
        const orig = read(Cwd.get('make_svelte_code_async/nested_orig.js'));
        const result = read(Cwd.get('make_svelte_code_async/nested_result.js')).replace(/\[root\]/g, Cwd.get());
        const async_code = await make_svelte_code_async(orig);
        deepStrictEqual(async_code, result);
    });
    it('each', async () => {
        const orig = read(Cwd.get('make_svelte_code_async/each_orig.js'));
        const result = read(Cwd.get('make_svelte_code_async/each_result.js')).replace(/\[root\]/g, Cwd.get());
        const async_code = await make_svelte_code_async(orig);
        deepStrictEqual(async_code, result);
    });
    it('keyed each', async () => {
        const orig = read(Cwd.get('make_svelte_code_async/keyed_each_orig.js'));
        const result = read(Cwd.get('make_svelte_code_async/keyed_each_result.js')).replace(/\[root\]/g, Cwd.get());
        const async_code = await make_svelte_code_async(orig);
        deepStrictEqual(async_code, result);
    });
    it('await', async () => {
        const orig = read(Cwd.get('make_svelte_code_async/await_orig.js'));
        const result = read(Cwd.get('make_svelte_code_async/await_result.js')).replace(/\[root\]/g, Cwd.get());
        const async_code = await make_svelte_code_async(orig);
        deepStrictEqual(async_code, result);
    });
});
