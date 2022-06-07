import { strictEqual } from 'assert';
import { describe } from 'mocha';
import { join } from 'path';
import { to_dirname, to_server_path } from '../../../src/utils/to.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/to/to_server_path', () => {
    const __dirname = to_dirname(import.meta.url);
    before(() => {
        Cwd.set(__dirname);
    });
    after(() => {
        Cwd.set(undefined);
    });
    it('undefined', () => {
        strictEqual(to_server_path(), '');
    });
    it('empty', () => {
        strictEqual(to_server_path(''), '');
    });
    it('without cwd', () => {
        strictEqual(to_server_path(join('test.txt')), 'test.txt');
    });
    it('add after cwd', () => {
        strictEqual(to_server_path(join(__dirname, 'test.txt')), join(__dirname, 'gen', 'server', 'test.txt'));
    });
    it('replace gen/src after cwd', () => {
        strictEqual(to_server_path(join(__dirname, 'gen', 'src', 'test.txt')), join(__dirname, 'gen', 'server', 'test.txt'));
    });
    it('replace gen/src', () => {
        strictEqual(to_server_path(join('huhu', 'gen', 'src', 'test.txt')), join('huhu', 'gen', 'server', 'test.txt'));
    });
    it('convert svelte files', () => {
        strictEqual(to_server_path(join('huhu', 'gen', 'src', 'test.svelte')), join('huhu', 'gen', 'server', 'test.svelte'));
    });
});
