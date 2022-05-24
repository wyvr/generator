import { deepStrictEqual, strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { transform } from '../../src/worker_action/transform.js';
import { Cwd } from '../../src/vars/cwd.js';
import { join } from 'path';
import { copyFileSync } from 'fs';
import { collect_files, copy, read, remove } from '../../src/utils/file.js';

describe('worker_action/transform', () => {
    let logger_messages = [];
    const path = join(process.cwd(), 'test', 'worker_action', '_tests', 'transform');
    before(() => {
        // remove(join(path, '_simple'));
    });
    beforeEach(() => {});
    afterEach(() => {
        logger_messages = [];
    });
    after(() => {
        Cwd.value = process.cwd();
    });

    it('undefined', async () => {
        strictEqual(await transform(), false);
    });
    it('empty list', async () => {
        strictEqual(await transform([]), false);
    });
    it('simple', async () => {
        const files = collect_files(join(path, 'simple'));
        files.forEach((file) => {
            copy(file, file.replace('/simple/', '/_simple/'));
        });
        strictEqual(
            await transform([join(path, '_simple', 'svelte.svelte'), join(path, '_simple', 'nonexisting.svelte')]),
            true
        );
        strictEqual(
            read(join(path, '_simple', 'svelte.svelte')),
            `<script>
    let a = 'test';
function test(a) {
    return '#' + a;
}
</script>

<p>{a}</p>


<style>p {
    border: 1px solid red;
}
    p {
        color: red;
    }
</style>`
        );
        remove(join(path, '_simple'));
    });
});
