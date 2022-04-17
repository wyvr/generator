import { strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { to_index } from '../../../src/utils/file.js';

describe('utils/file/to_index', () => {
    it('no filename', () => {
        strictEqual(to_index(null), 'index.html');
        strictEqual(to_index(undefined), 'index.html');
        strictEqual(to_index(''), 'index.html');
    });
    it('wrong type', () => {
        strictEqual(to_index(false), 'index.html');
        strictEqual(to_index(true), 'index.html');
        strictEqual(to_index([]), 'index.html');
        strictEqual(to_index({}), 'index.html');
    });
    it('no appending', () => {
        strictEqual(to_index('/index.html'), '/index.html');
        strictEqual(to_index('./test/index.html'), './test/index.html');
        strictEqual(to_index('foo/bar/demo.txt'), 'foo/bar/demo.txt');
        strictEqual(to_index('foo/bar/demo.json'), 'foo/bar/demo.json');
    });
    it('add index.html', () => {
        strictEqual(to_index('/'), '/index.html');
        strictEqual(to_index('./test'), './test/index.html');
        strictEqual(to_index('foo/bar/'), 'foo/bar/index.html');
        strictEqual(to_index('foo/bar'), 'foo/bar/index.html');
    });
    it('custom extension', () => {
        strictEqual(to_index('/', 'json'), '/index.json');
        strictEqual(to_index('./test', 'json'), './test/index.json');
        strictEqual(to_index('foo/bar/', 'json'), 'foo/bar/index.json');
        strictEqual(to_index('foo/bar', 'json'), 'foo/bar/index.json');
    });
    it('custom extension, no appending', () => {
        strictEqual(to_index('/index.html', 'json'), '/index.html');
        strictEqual(to_index('./test/index.html', 'json'), './test/index.html');
        strictEqual(to_index('foo/bar/demo.txt', 'json'), 'foo/bar/demo.txt');
        strictEqual(to_index('foo/bar/demo.json', 'json'), 'foo/bar/demo.json');
    });
    it('dotfiles', () => {
        strictEqual(to_index('/.htaccess', 'json'), '/.htaccess.json');
        strictEqual(to_index('./test/.htaccess', 'json'), './test/.htaccess.json');
        strictEqual(to_index('foo/bar/.htaccess', 'json'), 'foo/bar/.htaccess.json');
    });
});
