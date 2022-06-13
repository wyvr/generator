import { deepStrictEqual, strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { execute_server_compiled_svelte } from '../../../src/utils/compile_svelte.js';
import { Cwd } from '../../../src/vars/cwd.js';
import { join } from 'path';
import { to_plain } from '../../../src/utils/to.js';
import Sinon from 'sinon';
import { Logger } from '../../../src/utils/logger.js';
import { read } from '../../../src/utils/file.js';

describe('utils/compile_svelte/execute_server_compiled_svelte', () => {
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
        deepStrictEqual(await execute_server_compiled_svelte(), undefined);
        deepStrictEqual(log, [['', '', '⚠', "can't execute", 'no code found']]);
    });
    it('undefined, but file', async () => {
        deepStrictEqual(await execute_server_compiled_svelte(undefined, 'file'), undefined);
        deepStrictEqual(log, [['', '', '⚠', "can't execute", 'file', 'no code found']]);
    });
    it('missing file', async () => {
        deepStrictEqual(await execute_server_compiled_svelte({ js: { code: 'code' } }), undefined);
        deepStrictEqual(log, [['', '', '⚠', "can't execute code without file"]]);
    });
    it('throw error', async () => {
        deepStrictEqual(await execute_server_compiled_svelte({ js: { code: 'export default a;' } }, 'file'), undefined);
        deepStrictEqual(log[0][3].indexOf('@svelte server execute') > -1, true, 'contains error message');
        deepStrictEqual(log[0][3].indexOf('[ReferenceError] a is not defined') > -1, true, 'contains reference error');
    });
});
