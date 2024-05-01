import { deepStrictEqual, strictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { render_server_compiled_svelte } from '../../../src/utils/compile_svelte.js';
import { Cwd } from '../../../src/vars/cwd.js';
import { join } from 'node:path';
import { to_plain } from '../../../src/utils/to.js';
import Sinon from 'sinon';

describe('utils/compile_svelte/render_server_compiled_svelte', () => {
    let log = [];
    let send_data;
    let mock_send;
    const path = join(process.cwd(), 'test', 'utils', 'compile_svelte', '_tests');
    before(() => {
        Cwd.set(path);
        Sinon.stub(console, 'error');
        console.error.callsFake((...msg) => {
            log.push(msg.map(to_plain));
        });
        mock_send = process.send;
        process.send = (data) => {
            send_data = data;
        };
    });
    beforeEach(() => {});
    afterEach(() => {
        log = [];
    });
    after(() => {
        Cwd.set(undefined);
        console.error.restore();
        process.send = mock_send;
    });

    it('undefined', async () => {
        deepStrictEqual(await render_server_compiled_svelte(), undefined);
        deepStrictEqual(log, []);
    });
    it('correct interface but no data', async () => {
        deepStrictEqual(
            await render_server_compiled_svelte({ compiled: true, component: true, result: true }),
            undefined
        );
        deepStrictEqual(log, []);
    });
    it('correct interface but no file', async () => {
        deepStrictEqual(
            await render_server_compiled_svelte({ compiled: true, component: true, result: true }, {}),
            undefined
        );
        deepStrictEqual(log, []);
    });
    it('correct interface and file', async () => {
        const result = await render_server_compiled_svelte(
            {
                compiled: true,
                component: { render: async () => ({ html: `<!-- HTML_TAG_START -->huhu ${await onServer(()=> 'value')} ${await onServer()}<!-- HTML_TAG_END -->` }) },
                result: true,
            },
            {},
            'file'
        );
        deepStrictEqual(result?.result?.html, 'huhu value undefined');
        deepStrictEqual(log, []);
    });
    it('correct interface and file', async () => {
        deepStrictEqual(
            await render_server_compiled_svelte(
                {
                    compiled: true,
                    component: {
                        render: () => {
                            throw new Error('huhu');
                        },
                    },
                    result: true,
                },
                {},
                'file'
            ),
            undefined
        );
        deepStrictEqual(log, [['✖', '@svelte server render\n[Error] huhu\nsource file']]);
    });
});
