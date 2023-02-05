import { strictEqual, deepStrictEqual } from 'assert';
import { join } from 'path';
import { Cwd } from '../../../src/vars/cwd.js';
import { check_env } from '../../../src/action/check_env.js';
import { to_dirname, to_plain } from '../../../src/utils/to.js';
import Sinon from 'sinon';

describe('action/check_env/check_env', () => {
    const cwd = Cwd.get();
    const __dirname = to_dirname(import.meta.url);
    const __root = join(__dirname, '..', '..', '..');

    let exit_value;
    let log = [];
    let sandbox;
    before(() => {
        sandbox = Sinon.createSandbox();
        sandbox.stub(process, 'exit');
        process.exit.callsFake((code) => {
            exit_value = code;
        });
        sandbox.stub(console, 'log');
        console.log.callsFake((...args) => {
            log.push(args.map(to_plain));
        });
        sandbox.stub(console, 'error');
        console.error.callsFake((...args) => {
            log.push(args.map(to_plain));
        });
        Cwd.set(cwd);
    });
    afterEach(() => {
        exit_value = undefined;
        log = [];
    });
    after(() => {
        sandbox.restore();
        Cwd.set(undefined);
    });

    it('error run in same folder', async () => {
        Cwd.set(__root);
        await check_env();
        deepStrictEqual(log, [
            ['✖', 'current directory is wyvr root folder, please start wyvr in another directory'],
            ['✖', 'terminated wyvr because of critical errors'],
        ]);
        strictEqual(exit_value, 1);
    });
    it('missing package.json', async () => {
        Cwd.set(join(__dirname, '_tests', 'empty'));
        await check_env();
        deepStrictEqual(log, [
            ['⚠', 'package.json is not present'],
            ['✖', 'wyvr.js is not present'],
            ['✖', 'terminated wyvr because of critical errors'],
        ]);
        strictEqual(exit_value, 1);
    });
    it('invalid package.json', async () => {
        Cwd.set(join(__dirname, '_tests', 'invalid'));
        await check_env();
        deepStrictEqual(log, [
            ['⚠', 'package.json is invalid JSON'],
            ['✖', 'wyvr.js is not present'],
            ['✖', 'terminated wyvr because of critical errors'],
        ]);
        strictEqual(exit_value, 1);
    });
    it('missing wyvr.js', async () => {
        Cwd.set(join(__dirname, '_tests', 'empty'));
        await check_env();
        deepStrictEqual(log, [
            ['⚠', 'package.json is not present'],
            ['✖', 'wyvr.js is not present'],
            ['✖', 'terminated wyvr because of critical errors'],
        ]);
        strictEqual(exit_value, 1);
    });
});
