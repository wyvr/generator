import { deepStrictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { extract_cli_config } from '../../../src/cli/config.js';

describe('cli/config/extract_cli_config', () => {
    const default_config = {
        cwd: process.cwd(),
        interpreter: undefined,
        script: undefined,
        command: [],
        flags: undefined,
    };
    it('undefined', () => {
        deepStrictEqual(extract_cli_config(), default_config);
    });
    it('string', () => {
        deepStrictEqual(extract_cli_config('fail'), default_config);
    });
    it('object', () => {
        deepStrictEqual(extract_cli_config({ hack: true }), default_config);
    });
    it('empty array', () => {
        deepStrictEqual(extract_cli_config([]), default_config);
    });
    it('args with only interpreter', () => {
        deepStrictEqual(extract_cli_config(['node']), Object.assign({}, default_config, { interpreter: 'node' }));
    });
    it('args with interpreter and script', () => {
        deepStrictEqual(
            extract_cli_config(['node', 'script']),
            Object.assign({}, default_config, { interpreter: 'node', script: 'script' })
        );
    });
    it('single command', () => {
        deepStrictEqual(
            extract_cli_config(['node', 'script', 'cmd']),
            Object.assign({}, default_config, { interpreter: 'node', script: 'script', command: ['cmd'] })
        );
    });
    it('detail command', () => {
        deepStrictEqual(
            extract_cli_config(['node', 'script', 'cmd', 'create', 'cake']),
            Object.assign({}, default_config, {
                interpreter: 'node',
                script: 'script',
                command: ['cmd', 'create', 'cake'],
            })
        );
    });
    it('Uppercase command', () => {
        deepStrictEqual(
            extract_cli_config(['node', 'script', 'CMD', 'CREATE', 'CAKE']),
            Object.assign({}, default_config, {
                interpreter: 'node',
                script: 'script',
                command: ['cmd', 'create', 'cake'],
            })
        );
    });
    it('flag', () => {
        deepStrictEqual(
            extract_cli_config(['node', 'script', '--version']),
            Object.assign({}, default_config, { interpreter: 'node', script: 'script', flags: { version: true } })
        );
    });
    it('duplicate flags', () => {
        deepStrictEqual(
            extract_cli_config(['node', 'script', '--version', '--version']),
            Object.assign({}, default_config, { interpreter: 'node', script: 'script', flags: { version: true } })
        );
    });
    it('multiple flags', () => {
        deepStrictEqual(
            extract_cli_config(['node', 'script', '--version', '--verbose']),
            Object.assign({}, default_config, {
                interpreter: 'node',
                script: 'script',
                flags: { version: true, verbose: true },
            })
        );
    });
    it('flag value boolean', () => {
        deepStrictEqual(
            extract_cli_config(['node', 'script', '-a=true', '-b=TRUE', '-c=false', '-d=FALSE']),
            Object.assign({}, default_config, {
                interpreter: 'node',
                script: 'script',
                flags: { a: true, b: true, c: false, d: false },
            })
        );
    });
    it('flag value number', () => {
        deepStrictEqual(
            extract_cli_config(['node', 'script', '--worker=0.5', '-a=1']),
            Object.assign({}, default_config, {
                interpreter: 'node',
                script: 'script',
                flags: { worker: 0.5, a: 1 },
            })
        );
    });
    it('flag value multiple', () => {
        deepStrictEqual(
            extract_cli_config(['node', 'script', '--worker=0.5', '--worker=0.75']),
            Object.assign({}, default_config, {
                interpreter: 'node',
                script: 'script',
                flags: { worker: 0.75 },
            })
        );
    });
    it('flag value string', () => {
        deepStrictEqual(
            extract_cli_config(['node', 'script', '-b=text', '-c="text"', '-d="some text"']),
            Object.assign({}, default_config, {
                interpreter: 'node',
                script: 'script',
                flags: { b: 'text', c: 'text', d: 'some text' },
            })
        );
    });
    it('flag value string with double dashes', () => {
        deepStrictEqual(
            extract_cli_config(['node', 'script', '--b=text', '--c="text"', '--d="some text"']),
            Object.assign({}, default_config, {
                interpreter: 'node',
                script: 'script',
                flags: { b: 'text', c: 'text', d: 'some text' },
            })
        );
    });
    it('combine flag values into single strings', () => {
        deepStrictEqual(
            extract_cli_config(['node', 'script', '-a=some', 'text', '--b=here', 'also']),
            Object.assign({}, default_config, {
                interpreter: 'node',
                script: 'script',
                flags: { a: 'some text', b: 'here also' },
            })
        );
    });
    it('special behaviour inspect', () => {
        deepStrictEqual(
            extract_cli_config(['node', 'script', '--inspect']),
            Object.assign({}, default_config, {
                interpreter: 'node',
                script: 'script',
                flags: { inspect: true, single: true },
            })
        );
    });
});
