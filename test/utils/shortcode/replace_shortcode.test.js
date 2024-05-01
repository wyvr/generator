import { deepStrictEqual } from 'node:assert';
import { join } from 'node:path';
import Sinon from 'sinon';
import { modify_svelte_internal } from '../../../src/action/modify_svelte.mjs';
import { FOLDER_GEN_SERVER } from '../../../src/constants/folder.js';
import { collect_files, exists, find_file, read, remove, write } from '../../../src/utils/file.js';
import { replace_shortcode } from '../../../src/utils/shortcode.js';
import { to_plain } from '../../../src/utils/to.js';
import { Cwd } from '../../../src/vars/cwd.js';
import { ReleasePath } from '../../../src/vars/release_path.js';

describe('utils/shortcode/replace_shortcode', () => {
    let log = [];
    const root = join(process.cwd(), 'test/utils/shortcode/_tests');
    before(async () => {
        Cwd.set(root);
        ReleasePath.set(root);
        Sinon.stub(console, 'error');
        console.error.callsFake((...msg) => {
            log.push(msg.map(to_plain));
        });

        const internal_file = find_file('.', ['node_modules/svelte/internal/index.mjs']);
        const internal_path = join(root, FOLDER_GEN_SERVER, 'svelte_internal.mjs');
        if (!exists(internal_path)) {
            write(internal_path, await modify_svelte_internal(read(internal_file)));
        }
    });
    afterEach(() => {
        log = [];
    });
    after(() => {
        Cwd.set(undefined);
        ReleasePath.set(undefined);
        console.error.restore();
        collect_files(join(root, 'gen/css')).forEach((f) => remove(f));
    });
    it('undefined', async () => {
        deepStrictEqual(await replace_shortcode(), undefined);
        deepStrictEqual(log, []);
    });
    it('no shortcode', async () => {
        deepStrictEqual(await replace_shortcode('here is the content', {}, 'file'), {
            html: 'here is the content',
            identifier: undefined,
            media_query_files: undefined,
            shortcode_imports: undefined,
        });
        deepStrictEqual(log, []);
    });
    it('simple shortcode', async () => {
        deepStrictEqual(await replace_shortcode('here is the ((tag a={true})) content', {}, 'file'), {
            html: 'here is the <span class="green svelte-57clml">awesome</span> content',
            identifier: '1503916a2ab2b0fd',
            media_query_files: {
                '/css/1503916a2ab2b0fd.css': {},
            },
            shortcode_imports: {
                Tag: join(root, 'gen', 'src', 'tag.svelte'),
            },
        });
        deepStrictEqual(log, []);
    });
    it('simple shortcode no props', async () => {
        deepStrictEqual(await replace_shortcode('here is the ((tag)) content', {}, 'file'), {
            html: 'here is the <span class="red svelte-57clml">missing</span> content',
            identifier: '1503916a2ab2b0fd',
            media_query_files: {
                '/css/1503916a2ab2b0fd.css': {},
            },
            shortcode_imports: {
                Tag: join(root, 'gen', 'src', 'tag.svelte'),
            },
        });
        deepStrictEqual(log, []);
    });
    it('unknown shortcode', async () => {
        deepStrictEqual(await replace_shortcode('here is the ((huhu)) content', {}, 'file'), {
            html: 'here is the <Huhu /> content',
            identifier: undefined,
            media_query_files: undefined,
            shortcode_imports: undefined,
        });
        deepStrictEqual(
            log.map((l) => l.map((i) => i.replace(/\/tmp\/[^.]+\.js/g, '/tmp/TMP.js'))),
            [
                [
                    '✖',
                    '@svelte server execute\n' +
                        `[Error] Cannot find module '${root}/gen/server/huhu.js' imported from ${root}/gen/tmp/TMP.js\n` +
                        'source file',
                ],
            ]
        );
    });
});
