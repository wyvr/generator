import { strictEqual, deepStrictEqual } from 'assert';
import { existsSync, mkdirSync, rmdirSync } from 'fs';
import { describe, it } from 'mocha';
import { dirname, join, resolve } from 'path';
import Sinon from 'sinon';
import { fileURLToPath } from 'url';
import { unknown_command } from '../../src/command/unknown.js';
import { Logger } from '../../src/utils/logger.js';
import { Cwd } from '../../src/vars/cwd.js';

describe('command/unknown', () => {
    const __dirname = dirname(resolve(join(fileURLToPath(import.meta.url))));
    const __root = join(__dirname, '..', '..', '..');
    const __path = join('test', 'command', '_tests', 'unknown_command');
    const test_folder = join(__root, __path);
    let sandbox;
    let exit_code;
    let logger_messages = [];

    before(() => {
        Cwd.set(__root);
        sandbox = Sinon.createSandbox();
        sandbox.stub(process, 'exit');
        process.exit.callsFake((code) => {
            exit_code = code;
        });
        sandbox.stub(Logger, 'output');
        Logger.output.callsFake((...msg) => {
            logger_messages.push(msg.slice(3));
        });
    });
    beforeEach(() => {
        mkdirSync(test_folder, { recursive: true });
    });
    afterEach(() => {
        exit_code = undefined;
        logger_messages = [];
        if (existsSync(test_folder)) {
            rmdirSync(test_folder, { recursive: true, force: true });
        }
    });
    after(() => {
        Cwd.set(undefined);
        sandbox.restore();
    });
    it('undefined', async () => {
        const result = await unknown_command();
        strictEqual(exit_code, 1, 'exit code is not 1');
        strictEqual(result, undefined);
        deepStrictEqual(logger_messages, [['no command set']]);
    });
    it('unknown', async () => {
        const result = await unknown_command({ cli: { command: ['unknown'] } });
        strictEqual(exit_code, 1, 'exit code is not 1');
        strictEqual(result, undefined);
        deepStrictEqual(logger_messages, [['unknown command unknown']]);
    });
});
