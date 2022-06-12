import { strictEqual } from 'assert';
import { describe } from 'mocha';
import { join } from 'path';
import { to_dirname, to_relative_path } from '../../../src/utils/to.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/to/to_relative_path', () => {
    const __dirname = to_dirname(import.meta.url);
    before(() => {
        Cwd.set(__dirname);
    });
    after(() => {
        Cwd.set(undefined);
    });
    it('undefined', () => {
        strictEqual(to_relative_path(), '');
    });
    it('empty', () => {
        strictEqual(to_relative_path(''), '');
    });
    it('without gen', () => {
        strictEqual(to_relative_path(join('test.txt')), 'test.txt');
    });
    it('add after gen', () => {
        strictEqual(to_relative_path(join(__dirname, 'gen', 'server', 'test.txt')), join('test.txt'));
    });
    it('replace gen', () => {
        strictEqual(to_relative_path(join('huhu', 'gen', 'src', 'test.txt')), join('test.txt'));
    });
});
