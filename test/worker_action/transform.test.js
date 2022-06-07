import { deepStrictEqual, strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { transform } from '../../src/worker_action/transform.js';
import { Cwd } from '../../src/vars/cwd.js';
import { join } from 'path';
import { copyFileSync } from 'fs';
import { collect_files, copy, exists, read, remove } from '../../src/utils/file.js';
import { FOLDER_GEN_CLIENT, FOLDER_GEN_SERVER, FOLDER_GEN_SRC } from '../../src/constants/folder.js';

describe('worker_action/transform', () => {
    let logger_messages = [];
    const path = join(process.cwd(), 'test', 'worker_action', '_tests', 'transform');
    before(() => {
        Cwd.set(path);
        // remove(join(path, '_simple'));
    });
    beforeEach(() => {});
    afterEach(() => {
        logger_messages = [];
    });
    after(() => {
        Cwd.set(undefined);
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
            await transform([
                join(path, '_simple', FOLDER_GEN_SRC, 'svelte.svelte'),
                join(path, '_simple', FOLDER_GEN_SRC, 'nonexisting.svelte'),
            ]),
            true
        );
        strictEqual(
            exists(join(path, '_simple', FOLDER_GEN_CLIENT, 'nonexisting.svelte')),
            false,
            'Non existing file was created'
        );
        strictEqual(
            read(join(path, '_simple', FOLDER_GEN_CLIENT, 'svelte.svelte')),
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
        strictEqual(
            read(join(path, '_simple', FOLDER_GEN_SERVER, 'svelte.svelte')),
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
    it('with import', async () => {
        const files = collect_files(join(path, 'import'));
        files.forEach((file) => {
            copy(file, file.replace('/import/', '/_import/'));
        });
        strictEqual(
            await transform([
                join(path, '_import', FOLDER_GEN_SRC, 'svelte.svelte'),
                join(path, '_import', FOLDER_GEN_SRC, 'container.svelte')
            ]),
            true
        );
        strictEqual(
            read(join(path, '_import', FOLDER_GEN_CLIENT, 'svelte.svelte')),
            `<script>
    import Container from '${process.cwd()}/test/worker_action/_tests/transform/gen/src/container.svelte';
    let a = 'test';
function test(a) {
    return '#' + a;
}
</script>

<Container><span>{a}</span></Container>


<style>p {
    border: 1px solid red;
}
    p {
        color: red;
    }
</style>`
        );
        strictEqual(
            read(join(path, '_import', FOLDER_GEN_SERVER, 'svelte.svelte')),
            `<script>
    import Container from '${process.cwd()}/test/worker_action/_tests/transform/gen/src/container.svelte';
    let a = 'test';
function test(a) {
    return '#' + a;
}
</script>

<Container><span>{a}</span></Container>


<style>p {
    border: 1px solid red;
}
    p {
        color: red;
    }
</style>`
        );
        remove(join(path, '_import'));
    });
});
