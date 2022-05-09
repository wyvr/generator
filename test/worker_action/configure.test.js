import { deepStrictEqual, strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { configure } from '../../src/worker_action/configure.js';
import { Logger } from '../../src/utils/logger.js';
import Sinon from 'sinon';
import { EnvType } from '../../src/struc/env.js';
import { join } from 'path';
import { Env } from '../../src/vars/env.js';
import { Config } from '../../src/utils/config.js';
import { Cwd } from '../../src/vars/cwd.js';
import { ReleasePath } from '../../src/vars/release_path.js';
import { WyvrPath } from '../../src/vars/wyvr_path.js';
import { UniqId } from '../../src/vars/uniq_id.js';
import { Report } from '../../src/vars/report.js';

describe('worker_action/configure', () => {
    let logger_messages = [];
    before(() => {
        Sinon.stub(Logger, 'output');
        Logger.output.callsFake((...msg) => {
            logger_messages.push(msg.slice(3));
        });
    });
    beforeEach(() => {});
    afterEach(() => {
        logger_messages = [];
    });
    after(() => {
        Cwd.value = process.cwd();
        Env.value = undefined;
        Logger.output.restore();
        Config.replace(undefined);
        ReleasePath.value = undefined;
        WyvrPath.value = undefined;
        UniqId.value = undefined;
        Report.value = undefined;
    });

    it('undefined', async () => {
        strictEqual(await configure(), false);
        deepStrictEqual(logger_messages, [['invalid config']]);
    });
    it('wrong config', async () => {
        const cwd = process.cwd();
        strictEqual(
            await configure({
                cwd,
                huhu: true,
            }),
            false
        );
        deepStrictEqual(logger_messages, [['invalid config', `{"cwd":"${cwd}","huhu":true}`]]);
    });
    it('valid config', async () => {
        const cwd = process.cwd();
        strictEqual(
            await configure({
                config: { key: 'value' },
                env: EnvType.debug,
                cwd,
                release_path: join(cwd, 'test', 'worker_action', '_tests'),
                wyvr_path: join(cwd, 'src'),
                uniq_id: 'a1e00893577046ae804a0fb3ca202177',
                report: false,
            }),
            true
        );
        deepStrictEqual(logger_messages, []);
    });
});