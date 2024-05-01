import { deepStrictEqual, strictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { prepare_code_to_compile } from '../../../src/utils/compile_svelte.js';
import { Cwd } from '../../../src/vars/cwd.js';
import { join } from 'node:path';
import { to_plain } from '../../../src/utils/to.js';
import Sinon from 'sinon';
import { Logger } from '../../../src/utils/logger.js';
import { read } from '../../../src/utils/file.js';
import { Env } from '../../../src/vars/env.js';
import { EnvType } from '../../../src/struc/env.js';

describe('utils/compile_svelte/prepare_code_to_compile', () => {
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
        deepStrictEqual(await prepare_code_to_compile(), undefined);
    });
    it('simple', async () => {
        deepStrictEqual(await prepare_code_to_compile('<p>Hello</p>', 'file', 'server'), '<p>Hello</p>');
    });
    it('import', async () => {
        Env.set(EnvType.debug);
        const result = await prepare_code_to_compile(
            '<script>import Header from "@src/component/Header.svelte";</script> <Header />',
            'file',
            'server'
        );
        Env.value = undefined;
        strictEqual(
            result.indexOf(
                `<script>import Header from '${process.cwd()}/test/utils/compile_svelte/_tests/gen/server/component/Header.js?`
            ) > -1,
            true,
            "Doesn't contain cache breaker"
        );
    });
});
