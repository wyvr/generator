import { strictEqual } from 'node:assert';
import { describe } from 'mocha';
import { join } from 'node:path';
import { to_dirname, to_client_path } from '../../../src/utils/to.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/to/to_client_path', () => {
    const __dirname = to_dirname(import.meta.url);
    before(() => {
        Cwd.set(__dirname);
    });
    after(() => {
        Cwd.set(undefined);
    });
    it('undefined', () => {
        strictEqual(to_client_path(), '');
    });
    it('empty', () => {
        strictEqual(to_client_path(''), '');
    });
    it('without cwd', () => {
        strictEqual(to_client_path(join('test.txt')), 'test.txt');
    });
    it('add after cwd', () => {
        strictEqual(to_client_path(join(__dirname, 'test.txt')), join(__dirname, 'gen', 'client', 'test.txt'));
    });
    it('replace gen/src after cwd', () => {
        strictEqual(to_client_path(join(__dirname, 'gen', 'src', 'test.txt')), join(__dirname, 'gen', 'client', 'test.txt'));
    });
    it('replace gen/src', () => {
        strictEqual(to_client_path(join('huhu', 'gen', 'src', 'test.txt')), join('huhu', 'gen', 'client', 'test.txt'));
    });
});
