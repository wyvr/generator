import { strictEqual } from 'node:assert';
import { describe } from 'mocha';
import { join } from 'node:path';
import { to_dirname, to_relative_path_of_gen } from '../../../src/utils/to.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/to/to_relative_path_of_gen', () => {
    const __dirname = to_dirname(import.meta.url);
    before(() => {
        Cwd.set(__dirname);
    });
    after(() => {
        Cwd.set(undefined);
    });
    it('undefined', () => {
        strictEqual(to_relative_path_of_gen(), '');
    });
    it('empty', () => {
        strictEqual(to_relative_path_of_gen(''), '');
    });
    it('without gen', () => {
        strictEqual(to_relative_path_of_gen(join('test.txt')), 'test.txt');
    });
    it('add after gen', () => {
        strictEqual(to_relative_path_of_gen(join(__dirname, 'gen', 'server', 'test.txt')), join('server', 'test.txt'));
    });
    it('replace gen', () => {
        strictEqual(to_relative_path_of_gen(join('huhu', 'gen', 'src', 'test.txt')), join('src', 'test.txt'));
    });
    it('replace gen without prefixed text', () => {
        strictEqual(to_relative_path_of_gen(join('gen', 'src', 'test.txt')), join('src', 'test.txt'));
    });
});
