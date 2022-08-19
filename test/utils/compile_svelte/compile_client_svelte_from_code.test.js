import { deepStrictEqual, strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { compile_client_svelte_from_code } from '../../../src/utils/compile_svelte.js';
import { Cwd } from '../../../src/vars/cwd.js';
import { join } from 'path';
import { to_plain } from '../../../src/utils/to.js';
import Sinon from 'sinon';
import { Logger } from '../../../src/utils/logger.js';
import { read } from '../../../src/utils/file.js';

describe('utils/compile_svelte/compile_client_svelte_from_code', () => {
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
        deepStrictEqual(await compile_client_svelte_from_code(), undefined);
    });
});
