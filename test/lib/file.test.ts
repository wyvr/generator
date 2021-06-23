require('module-alias/register');


describe('Lib/File', () => {
    const assert = require('assert');
    const { File } = require('@lib/file');
    const fs = require('fs-extra');
    const { v4 } = require('uuid');
    const path = require('path');
    
    describe('to_extension', () => {
        it('no filename', () => {
            assert.strictEqual(File.to_extension(null), '');
            assert.strictEqual(File.to_extension(undefined), '');
        });
        it('empty filename', () => {
            assert.strictEqual(File.to_extension(''), '');
        });
        it('wrong filename', () => {
            assert.strictEqual(File.to_extension(100), '');
            assert.strictEqual(File.to_extension({ a: 'a' }), '');
            assert.strictEqual(File.to_extension([0, 1, 2]), '');
        });
        it('missing extension', () => {
            assert.strictEqual(File.to_extension('test.js'), 'test.js');
            assert.strictEqual(File.to_extension('test.js', null), 'test.js');
            assert.strictEqual(File.to_extension('test.js', ''), 'test.js');
        });
        it('missing extension', () => {
            assert.strictEqual(File.to_extension('test', 'txt'), 'test.txt');
        });
        it('change extension', () => {
            assert.strictEqual(File.to_extension('test.js', '.txt'), 'test.txt');
            assert.strictEqual(File.to_extension('test.js', 'txt'), 'test.txt');
        });
        it('change extension with path', () => {
            assert.strictEqual(File.to_extension('test/test.js', '.txt'), 'test/test.txt');
            assert.strictEqual(File.to_extension('test/test.js', 'txt'), 'test/test.txt');
        });
        it('change extension with multiple dots', () => {
            assert.strictEqual(File.to_extension('test/.hidden/test.js', '.txt'), 'test/.hidden/test.txt');
            assert.strictEqual(File.to_extension('test/.hidden/test.js', 'txt'), 'test/.hidden/test.txt');
        });
        it('dotfiles', () => {
            assert.strictEqual(File.to_extension('test/.htaccess', ''), 'test/.htaccess');
            assert.strictEqual(File.to_extension('test/.htaccess', null), 'test/.htaccess');
            assert.strictEqual(File.to_extension('test/.htaccess', '.txt'), 'test/.htaccess.txt');
        });
    });
    describe('to_index', () => {
        it('no filename', () => {
            assert.strictEqual(File.to_index(null), 'index.html');
            assert.strictEqual(File.to_index(undefined), 'index.html');
            assert.strictEqual(File.to_index(''), 'index.html');
        });
        it('wrong type', () => {
            assert.strictEqual(File.to_index(false), 'index.html');
            assert.strictEqual(File.to_index(true), 'index.html');
            assert.strictEqual(File.to_index([]), 'index.html');
            assert.strictEqual(File.to_index({}), 'index.html');
        });
        it('no appending', () => {
            assert.strictEqual(File.to_index('/index.html'), '/index.html');
            assert.strictEqual(File.to_index('./test/index.html'), './test/index.html');
            assert.strictEqual(File.to_index('foo/bar/demo.txt'), 'foo/bar/demo.txt');
            assert.strictEqual(File.to_index('foo/bar/demo.json'), 'foo/bar/demo.json');
        });
        it('add index.html', () => {
            assert.strictEqual(File.to_index('/'), '/index.html');
            assert.strictEqual(File.to_index('./test'), './test/index.html');
            assert.strictEqual(File.to_index('foo/bar/'), 'foo/bar/index.html');
            assert.strictEqual(File.to_index('foo/bar'), 'foo/bar/index.html');
        });
        it('custom extension', () => {
            assert.strictEqual(File.to_index('/', 'json'), '/index.json');
            assert.strictEqual(File.to_index('./test', 'json'), './test/index.json');
            assert.strictEqual(File.to_index('foo/bar/', 'json'), 'foo/bar/index.json');
            assert.strictEqual(File.to_index('foo/bar', 'json'), 'foo/bar/index.json');
        });
        it('custom extension, no appending', () => {
            assert.strictEqual(File.to_index('/index.html', 'json'), '/index.html');
            assert.strictEqual(File.to_index('./test/index.html', 'json'), './test/index.html');
            assert.strictEqual(File.to_index('foo/bar/demo.txt', 'json'), 'foo/bar/demo.txt');
            assert.strictEqual(File.to_index('foo/bar/demo.json', 'json'), 'foo/bar/demo.json');
        });
        it('dotfiles', () => {
            assert.strictEqual(File.to_index('/.htaccess', 'json'), '/.htaccess.json');
            assert.strictEqual(File.to_index('./test/.htaccess', 'json'), './test/.htaccess.json');
            assert.strictEqual(File.to_index('foo/bar/.htaccess', 'json'), 'foo/bar/.htaccess.json');
        });
    });
    describe('create_dir', () => {
        it('single', () => {
            const name = path.join(v4().split('-')[0], 'test.txt');
            assert.strictEqual(fs.existsSync(path.dirname(name)), false);
            File.create_dir(name);
            assert.strictEqual(fs.existsSync(path.dirname(name)), true);
            fs.removeSync(path.dirname(name));
        });
        it('deep', () => {
            const name = path.join(...v4().split('-'), 'test.txt');

            assert.strictEqual(fs.existsSync(path.dirname(name)), false);
            File.create_dir(name);
            assert.strictEqual(fs.existsSync(path.dirname(name)), true);
            fs.removeSync(name.split('/')[0]);
        });
    });
});
