import { strictEqual } from 'node:assert';
import { describe } from 'mocha';
import { join } from 'node:path';
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
        strictEqual(
            to_relative_path(join(__dirname, 'gen', 'server', 'test.txt')),
            join('test.txt')
        );
    });
    it('replace gen', () => {
        strictEqual(
            to_relative_path(join('huhu', 'gen', 'src', 'test.txt')),
            join('test.txt')
        );
    });
    it('replace release path for js but not the src in there, hydrated files have this subfolder', () => {
        strictEqual(
            to_relative_path(
                join('huhu', 'release', 'haha', 'js', 'src', 'test.txt')
            ),
            join('js/src/test.txt')
        );
    });

    it('avoid transformation of already relative paths', () => {
        strictEqual(
            to_relative_path('src/syntax/tests/LoadingInstant.svelte'),
            'syntax/tests/LoadingInstant.svelte'
        );
    });
});
