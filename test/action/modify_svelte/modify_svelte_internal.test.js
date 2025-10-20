import { deepStrictEqual } from 'node:assert';
import { readFileSync } from 'node:fs';
import { describe, it } from 'mocha';
import { join } from 'node:path';
import { modify_svelte_internal } from '../../../src/action/modify_svelte.mjs';
import { to_dirname } from '../../../src/utils/to.js';

describe('action/modify_svelte/modify_svelte_internal', () => {
    const __dirname = to_dirname(import.meta.url);
    const __root = join(__dirname, '..', '..');
    const __path = join('action', 'modify_svelte', '_tests', 'modify_svelte_internal');
    const test_folder = join(__root, __path);

    before(() => {});
    beforeEach(() => {});

    after(() => {});
    it('modify_svelte_internal 3.55.0', async () => {
        const orig = readFileSync(join(test_folder, '3.55.0', 'orig.js'), { encoding: 'utf8' });
        const result = readFileSync(join(test_folder, '3.55.0', 'result.js'), { encoding: 'utf8' }).split('\n');
        const output = modify_svelte_internal(orig);
        deepStrictEqual(output.split('\n'), result);
    });
    it('modify_svelte_internal 3.59.2', async () => {
        const orig = readFileSync(join(test_folder, '3.59.2', 'orig.js'), { encoding: 'utf8' });
        const result = readFileSync(join(test_folder, '3.59.2', 'result.js'), { encoding: 'utf8' }).split('\n');
        const output = modify_svelte_internal(orig);
        deepStrictEqual(output.split('\n'), result);
    });
    it('modify_svelte_internal 4.2.19', async () => {
        const orig = readFileSync(join(test_folder, '4.2.19', 'svelte/src/runtime/internal/ssr.js'), { encoding: 'utf8' });
        const result = readFileSync(join(test_folder, '4.2.19', 'svelte/src/runtime/internal/ssr.result'), { encoding: 'utf8' }).split('\n');
        const output = modify_svelte_internal(orig);
        deepStrictEqual(output.split('\n'), result);
    });
});
