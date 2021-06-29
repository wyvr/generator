require('module-alias/register');

describe('Lib/File', () => {
    const assert = require('assert');
    const { File } = require('@lib/file');
    const { WyvrFile } = require('@lib/model/wyvr/file');
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
        });
        it('remove extension', () => {
            assert.strictEqual(File.to_extension('test.js', ''), 'test');
            assert.strictEqual(File.to_extension('test', ''), 'test');
        });
        it('missing extension in file', () => {
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
            assert.strictEqual(File.to_extension('test/.htaccess.txt', ''), 'test/.htaccess');
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
    describe('read_json', () => {
        it('valid', () => {
            const test_file = 'test/lib/file/valid.json';
            assert.deepStrictEqual(File.read_json(test_file), { key: 'value' });
        });
        it('invalid', () => {
            const test_file = 'test/lib/file/invalid.json';
            const log = console.log;
            console.log = () => {};
            assert.deepStrictEqual(File.read_json(test_file), null);
            console.log = log;
        });
        it('non existing', () => {
            const test_file = 'test/lib/file/unknown.json';
            assert.deepStrictEqual(File.read_json(test_file), null);
        });
        it('empty', () => {
            const test_file = 'test/lib/file/empty.json';
            assert.deepStrictEqual(File.read_json(test_file), null);
        });
    });
    describe('find_file', () => {
        it('no value', () => {
            assert.deepStrictEqual(File.find_file('test/lib/file', null), null);
        });
        it('empty value', () => {
            assert.deepStrictEqual(File.find_file('test/lib/file', []), null);
        });
        it('wrong value', () => {
            assert.deepStrictEqual(File.find_file('test/lib/file', 'valid.json'), null);
            assert.deepStrictEqual(File.find_file('test/lib/file', 1), null);
            assert.deepStrictEqual(File.find_file('test/lib/file', true), null);
            assert.deepStrictEqual(File.find_file('test/lib/file', NaN), null);
        });
        it('single', () => {
            assert.deepStrictEqual(File.find_file('test/lib/file', ['valid.json']), 'test/lib/file/valid.json');
        });
        it('first', () => {
            assert.deepStrictEqual(File.find_file('test/lib/file', ['valid.json', 'invalid.json']), 'test/lib/file/valid.json');
        });
        it('second', () => {
            assert.deepStrictEqual(File.find_file('test/lib/file', ['unknown.json', 'valid.json', 'invalid.json']), 'test/lib/file/valid.json');
        });
        it('null/empty', () => {
            assert.deepStrictEqual(File.find_file('test/lib/file', [null, '', 'valid.json', 'invalid.json']), 'test/lib/file/valid.json');
        });
        it('not found', () => {
            assert.deepStrictEqual(File.find_file('test/lib/file', [null, '', 'unknown.json']), null);
        });
    });
    describe('collect_svelte_files', () => {
        it('default folder', () => {
            assert.deepStrictEqual(File.collect_svelte_files(), []);
            assert.deepStrictEqual(File.collect_svelte_files(''), []);
        });
        it('unknown folder', () => {
            assert.deepStrictEqual(File.collect_svelte_files('unknown_folder'), []);
        });
        it('partial unknown folder', () => {
            assert.deepStrictEqual(File.collect_svelte_files('test/lib/file/unknown_folder'), []);
        });
        it('valid', () => {
            assert.deepStrictEqual(File.collect_svelte_files('test/lib/file'), [
                new WyvrFile('test/lib/file/svelte/a.svelte'),
                new WyvrFile('test/lib/file/svelte/b/b.svelte'),
            ]);
        });
    });
    describe('collect_files', () => {
        it('default folder', () => {
            assert.deepStrictEqual(File.collect_files(), []);
            assert.deepStrictEqual(File.collect_files(''), []);
            assert.deepStrictEqual(File.collect_files('', null), []);
            assert.deepStrictEqual(File.collect_files(null, null), []);
            assert.deepStrictEqual(File.collect_files('test/lib/file/svelte', 'txt'), []);
        });
        it('unknown folder', () => {
            assert.deepStrictEqual(File.collect_files('unknown_folder', 'txt'), []);
            assert.deepStrictEqual(File.collect_files('unknown_folder', '.txt'), []);
        });
        it('partial unknown folder', () => {
            assert.deepStrictEqual(File.collect_files('test/lib/file/unknown_folder', 'txt'), []);
            assert.deepStrictEqual(File.collect_files('test/lib/file/unknown_folder', '.txt'), []);
        });
        it('valid', () => {
            assert.deepStrictEqual(File.collect_files('test/lib/file/svelte', null), [
                'test/lib/file/svelte/a.svelte',
                'test/lib/file/svelte/b/b.svelte',
            ]);
            assert.deepStrictEqual(File.collect_files('test/lib/file', 'svelte'), [
                'test/lib/file/svelte/a.svelte',
                'test/lib/file/svelte/b/b.svelte',
            ]);
            assert.deepStrictEqual(File.collect_files('test/lib/file', '.svelte'), [
                'test/lib/file/svelte/a.svelte',
                'test/lib/file/svelte/b/b.svelte',
            ]);
        });
    });
    describe('is_file', () => {
        it('no file', () => {
            assert.strictEqual(File.is_file(), false);
            assert.strictEqual(File.is_file(null), false);
            assert.strictEqual(File.is_file(undefined), false);
            assert.strictEqual(File.is_file(1), false);
            assert.strictEqual(File.is_file(true), false);
            assert.strictEqual(File.is_file(''), false);
            assert.strictEqual(File.is_file('test/lib/link/link'), false);
            assert.strictEqual(File.is_file('test'), false);
            assert.strictEqual(File.is_file('test/lib/file'), false);
        });
        it('file', () => {
            assert.strictEqual(File.is_file('test/lib/file/svelte/a.svelte'), true);
        });
        
    });
});
