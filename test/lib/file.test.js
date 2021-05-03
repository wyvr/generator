const assert = require('assert');
const file = require('./../../lib/file');
const fs = require('fs-extra');
const { v4: uuidv4} = require('uuid');
const path = require('path');

describe('Lib/File', () => {
    describe('to_extension', () => {
        it('no filename', () => {
            assert.strictEqual(file.to_extension(null), '');
            assert.strictEqual(file.to_extension(undefined), '');
        });
        it('empty filename', () => {
            assert.strictEqual(file.to_extension(''), '');
        });
        it('wrong filename', () => {
            assert.strictEqual(file.to_extension(100), '');
            assert.strictEqual(file.to_extension({ a: 'a' }), '');
            assert.strictEqual(file.to_extension([0, 1, 2]), '');
        });
        it('missing extension', () => {
            assert.strictEqual(file.to_extension('test.js'), '');
            assert.strictEqual(file.to_extension('test.js', null), '');
            assert.strictEqual(file.to_extension('test.js', ''), '');
        });
        it('missing extension', () => {
            assert.strictEqual(file.to_extension('test', 'txt'), 'test');
        });
        it('change extension', () => {
            assert.strictEqual(file.to_extension('test.js', '.txt'), 'test.txt');
            assert.strictEqual(file.to_extension('test.js', 'txt'), 'test.txt');
        });
        it('change extension with path', () => {
            assert.strictEqual(file.to_extension('test/test.js', '.txt'), 'test/test.txt');
            assert.strictEqual(file.to_extension('test/test.js', 'txt'), 'test/test.txt');
        });
        it('change extension with multiple dots', () => {
            assert.strictEqual(file.to_extension('test/.hidden/test.js', '.txt'), 'test/.hidden/test.txt');
            assert.strictEqual(file.to_extension('test/.hidden/test.js', 'txt'), 'test/.hidden/test.txt');
        });
    });
    describe('to_index', () => {
        it('no filename', () => {
            assert.strictEqual(file.to_index(null), 'index.html');
            assert.strictEqual(file.to_index(undefined), 'index.html');
            assert.strictEqual(file.to_index(''), 'index.html');
        });
        it('wrong type', () => {
            assert.strictEqual(file.to_index(false), 'index.html');
            assert.strictEqual(file.to_index(true), 'index.html');
            assert.strictEqual(file.to_index([]), 'index.html');
            assert.strictEqual(file.to_index({}), 'index.html');
        });
        it('no appending', () => {
            assert.strictEqual(file.to_index('/index.html'), '/index.html');
            assert.strictEqual(file.to_index('./test/index.html'), './test/index.html');
            assert.strictEqual(file.to_index('foo/bar/demo.txt'), 'foo/bar/demo.txt');
            assert.strictEqual(file.to_index('foo/bar/demo.json'), 'foo/bar/demo.json');
        });
        it('add index.html', () => {
            assert.strictEqual(file.to_index('/'), '/index.html');
            assert.strictEqual(file.to_index('./test'), './test/index.html');
            assert.strictEqual(file.to_index('foo/bar/'), 'foo/bar/index.html');
            assert.strictEqual(file.to_index('foo/bar'), 'foo/bar/index.html');
        });
        it('custom extension', () => {
            assert.strictEqual(file.to_index('/', 'json'), '/index.json');
            assert.strictEqual(file.to_index('./test', 'json'), './test/index.json');
            assert.strictEqual(file.to_index('foo/bar/', 'json'), 'foo/bar/index.json');
            assert.strictEqual(file.to_index('foo/bar', 'json'), 'foo/bar/index.json');
        });
        it('custom extension, no appending', () => {
            assert.strictEqual(file.to_index('/index.html', 'json'), '/index.html');
            assert.strictEqual(file.to_index('./test/index.html', 'json'), './test/index.html');
            assert.strictEqual(file.to_index('foo/bar/demo.txt', 'json'), 'foo/bar/demo.txt');
            assert.strictEqual(file.to_index('foo/bar/demo.json', 'json'), 'foo/bar/demo.json');
        });
    });
    describe('create_dir', ()=>{
        it('single', () => {
            const name = path.join(uuidv4().split('-')[0], 'test.txt');
            assert.strictEqual(fs.existsSync(path.dirname(name)), false);
            file.create_dir(name);
            assert.strictEqual(fs.existsSync(path.dirname(name)), true);
            fs.removeSync(name)
        });
        it('deep', () => {
            const name = path.join(...uuidv4().split('-'), 'test.txt');
            assert.strictEqual(fs.existsSync(path.dirname(name)), false);
            file.create_dir(name);
            assert.strictEqual(fs.existsSync(path.dirname(name)), true);
            fs.removeSync(name)
        });
    })
});
