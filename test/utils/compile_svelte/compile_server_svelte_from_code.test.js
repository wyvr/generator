import { deepStrictEqual, strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { compile_server_svelte_from_code } from '../../../src/utils/compile_svelte.js';
import { Cwd } from '../../../src/vars/cwd.js';
import { join } from 'path';
import { to_plain } from '../../../src/utils/to.js';
import Sinon from 'sinon';
import { Logger } from '../../../src/utils/logger.js';
import { read } from '../../../src/utils/file.js';

describe('utils/compile_svelte/compile_server_svelte_from_code', () => {
    let log = [];
    let send_data;
    let mock_send;
    const path = join(process.cwd(), 'test', 'utils', 'compile_svelte', '_tests');
    before(() => {
        Cwd.set(path);
        Sinon.stub(Logger, 'output');
        Logger.output.callsFake((...msg) => {
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
        Logger.output.restore();
        process.send = mock_send;
    });

    it('undefined', async () => {
        deepStrictEqual(await compile_server_svelte_from_code(), undefined);
    });
    it('File with imports', async () => {
        const file = join(path, 'Default.svelte');
        const content = read(file);
        const result = await compile_server_svelte_from_code(content, file);
        deepStrictEqual(Object.keys(result), ['js', 'css', 'ast', 'warnings', 'vars', 'stats']);
        deepStrictEqual(log, []);
    });
    it('missing import file', async () => {
        const file = join(path, 'Broken.svelte');
        const content = read(file);
        const result = await compile_server_svelte_from_code(content, file);
        deepStrictEqual(log, [
            [
                '',
                '',
                '⚠',
                '@svelte server prepare\n' +
                    `[Error] can't find import ${process.cwd()}/test/utils/compile_svelte/_tests/gen/server/nonexisting with the extensions .js,.mjs,.ts in ${process.cwd()}/test/utils/compile_svelte/_tests/Broken.svelte\n` +
                    'source Broken.svelte',
            ],
        ]);
    });
    it('throw error', async () => {
        const file = join(path, 'Throw.svelte');
        const content = read(file);
        const result = await compile_server_svelte_from_code(content, file);
        deepStrictEqual(log[0][2], '✖');
        deepStrictEqual(
            log[0][3],
            '@svelte server compile\n[ParseError] <script> must have a closing tag\nstack\n- 12:     </div>\n- 13:     <Footer {data} />\n- 14: </div>\n-           ^\nsource Throw.svelte'
        );
    });
});
