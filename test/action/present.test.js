import { strictEqual, deepStrictEqual } from 'assert';
import { existsSync, mkdirSync, rmdirSync } from 'fs';
import { describe, it } from 'mocha';
import { dirname, join, resolve } from 'path';
import Sinon from 'sinon';
import { fileURLToPath } from 'url';
import { present } from '../../src/action/present.js';
import { Logger } from '../../src/utils/logger.js';
import { Cwd } from '../../src/vars/cwd.js';
import { UniqId } from '../../src/vars/uniq_id.js';

describe('action/present', () => {
    const __dirname = dirname(resolve(join(fileURLToPath(import.meta.url))));
    const __root = join(__dirname, '..', '..');
    const __path = join('test', 'action', '_tests', 'present');
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
        sandbox.stub(process, 'pid').value(12345);
        sandbox.stub(Logger, 'output');
        Logger.output.callsFake((...msg) => {
            logger_messages.push(msg.slice(3));
        });
    });
    beforeEach(() => {
        UniqId.value = '01234567890';
        mkdirSync(test_folder, { recursive: true });
    });
    afterEach(() => {
        exit_code = undefined;
        UniqId.value = undefined;
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
        present();
        deepStrictEqual(logger_messages, [
            ['pid', '\x1B[32m12345\x1B[39m'],
            ['cwd', '\x1B[32m' + __root + '\x1B[39m'],
            ['id', '\x1B[32m01234\x1B[2m567890\x1B[22m\x1B[39m'],
            ['environment', '\x1B[32mprod\x1B[39m'],
            ['command', '\x1B[32m-\x1B[39m', '\x1B[2m\x1B[22m'],
        ]);
    });
    it('short id', async () => {
        UniqId.value = '0';
        present();
        deepStrictEqual(logger_messages, [
            ['pid', '\x1B[32m12345\x1B[39m'],
            ['cwd', '\x1B[32m' + __root + '\x1B[39m'],
            ['id', '\x1B[32m0\x1B[39m'],
            ['environment', '\x1B[32mprod\x1B[39m'],
            ['command', '\x1B[32m-\x1B[39m', '\x1B[2m\x1B[22m'],
        ]);
    });
    it('commands and flags', async () => {
        present({ cli: { command: ['build', 'the', 'site'], flags: { test: true, flag: true } } });
        deepStrictEqual(logger_messages, [
            ['pid', '\x1B[32m12345\x1B[39m'],
            ['cwd', '\x1B[32m' + __root + '\x1B[39m'],
            ['id', '\x1B[32m01234\x1B[2m567890\x1B[22m\x1B[39m'],
            ['environment', '\x1B[32mprod\x1B[39m'],
            ['command', '\x1B[32mbuild the site\x1B[39m', '\x1B[2mtest flag\x1B[22m'],
        ]);
    });
});
