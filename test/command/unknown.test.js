import { strictEqual, deepStrictEqual } from 'node:assert';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { describe, it } from 'mocha';
import { join } from 'node:path';
import Sinon from 'sinon';
import { unknown_command } from '../../src/command/unknown.js';
import { to_dirname } from '../../src/utils/to.js';
import { Cwd } from '../../src/vars/cwd.js';
import { fakeConsole } from '../utils/logger/fakeConsole.js';
import inquirer from 'inquirer';

describe('command/unknown', () => {
    const __dirname = to_dirname(import.meta.url);
    const __root = join(__dirname, '..', '..', '..');
    const __path = join('test', 'command', '_tests', 'unknown_command');
    const test_folder = join(__root, __path);
    let sandbox;
    let exit_code;
    let prompt_result;
    const C = fakeConsole();
    const base_commands = { builtin: {}, custom: {} };

    before(() => {
        Cwd.set(__root);
        sandbox = Sinon.createSandbox();
        sandbox.stub(process, 'exit');
        process.exit.callsFake((code) => {
            exit_code = code;
        });
        sandbox.stub(inquirer, 'prompt');
        inquirer.prompt.callsFake(() => {
            return prompt_result;
        });
    });
    beforeEach(() => {
        C.start();
        prompt_result = undefined;
        mkdirSync(test_folder, { recursive: true });
    });
    afterEach(() => {
        exit_code = undefined;
        if (existsSync(test_folder)) {
            rmSync(test_folder, { recursive: true, force: true });
        }
    });
    after(() => {
        Cwd.set(undefined);
        sandbox.restore();
    });
    it('undefined', async () => {
        const result = await unknown_command();
        const messages = C.end().join('|');
        strictEqual(exit_code, 1, 'exit code is not 1');
        strictEqual(result, undefined);
        deepStrictEqual(messages.indexOf('no internal commands found') > -1, true, `"no internal commands found" text not found in "${messages}"`);
    });
    it('unknown', async () => {
        const result = await unknown_command({ cli: { command: ['unknown'] } }, base_commands);
        const messages = C.end().join('|');
        strictEqual(exit_code, 1, 'exit code is not 1');
        strictEqual(result, undefined);
        deepStrictEqual(messages.indexOf('unknown command unknown') > -1, true, `"unknown command unknown" text not found in "${messages}"`);
    });
    it('builtin command partial name not mathing', async () => {
        const result = await unknown_command(
            { cli: { command: ['unkno'] } },
            {
                builtin: {
                    app: {
                        desc: 'AppDescription',
                        execute: () => true
                    }
                }
            }
        );
        strictEqual(exit_code, 1, 'exit code is not 1');
        strictEqual(result, undefined);
        const messages = C.end().join('|');
        strictEqual(messages.indexOf('unknown command unkno') > -1, true, `"unknown command unkno" text not found in "${messages}"`);
    });
    it('custom command', async () => {
        const result = await unknown_command(
            { cli: { command: ['unknown'] } },
            {
                custom: {
                    unknown: {
                        desc: 'UnknownDescription',
                        execute: () => true
                    }
                }
            }
        );
        strictEqual(exit_code, undefined, 'exit code is not undefined');
        strictEqual(result, true);
        const messages = C.end().join('|');
        strictEqual(messages.indexOf('unknown UnknownDescription') > -1, true, `"unknown UnknownDescription" text not found in "${messages}"`);
        strictEqual(messages.indexOf('unknown command unknown') === -1, true, `"unknown command unknown" text found in "${messages}"`);
    });
    it('custom command partial name, prompt yes', async () => {
        prompt_result = { execute: true };
        const result = await unknown_command(
            { cli: { command: ['unkno'] } },
            {
                custom: {
                    unknown: {
                        desc: 'UnknownDescription',
                        execute: () => true
                    }
                }
            }
        );
        strictEqual(exit_code, undefined, 'exit code is not undefined');
        strictEqual(result, true);
        const messages = C.end().join('|');
        strictEqual(messages.indexOf('unknown command unkno') === -1, true, `"unknown command unkno" text found in "${messages}"`);
        strictEqual(messages.indexOf('unknown command unknown') === -1, true, `"unknown command unknown" text found in "${messages}"`);

    });
    it('custom command partial name, prompt no', async () => {
        prompt_result = { execute: false };
        const result = await unknown_command(
            { cli: { command: ['unkno'] } },
            {
                custom: {
                    unknown: {
                        desc: 'UnknownDescription',
                        execute: () => true
                    }
                }
            }
        );
        strictEqual(exit_code, 1, 'exit code is not 1');
        strictEqual(result, undefined);
        const messages = C.end().join('|');
        strictEqual(messages.indexOf('unknown command unkno') > -1, true, `"unknown command unkno" text not found in "${messages}"`);

    });
});
