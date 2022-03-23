import { strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { to_extension } from '../../../src/utils/file.js';

describe('utils/file/to_extension', () => {
    it('null filename', () => {
        strictEqual(to_extension(null), '');
    });
    it('undefined filename', () => {
        strictEqual(to_extension(undefined), '');
    });
    it('empty filename', () => {
        strictEqual(to_extension(''), '');
    });
    it('wrong filename', () => {
        strictEqual(to_extension(100), '');
        strictEqual(to_extension({ a: 'a' }), '');
        strictEqual(to_extension([0, 1, 2]), '');
    });
    it('missing extension', () => {
        strictEqual(to_extension('test.js'), 'test.js');
        strictEqual(to_extension('test.js', null), 'test.js');
    });
    it('remove extension', () => {
        strictEqual(to_extension('test.js', ''), 'test');
        strictEqual(to_extension('test', ''), 'test');
    });
    it('missing extension in file', () => {
        strictEqual(to_extension('test', 'txt'), 'test.txt');
    });
    it('change extension', () => {
        strictEqual(to_extension('test.js', '.txt'), 'test.txt');
        strictEqual(to_extension('test.js', 'txt'), 'test.txt');
    });
    it('change extension with path', () => {
        strictEqual(to_extension('test/test.js', '.txt'), 'test/test.txt');
        strictEqual(to_extension('test/test.js', 'txt'), 'test/test.txt');
    });
    it('change extension with multiple dots', () => {
        strictEqual(to_extension('test/.hidden/test.js', '.txt'), 'test/.hidden/test.txt');
        strictEqual(to_extension('test/.hidden/test.js', 'txt'), 'test/.hidden/test.txt');
    });
    it('dotfiles', () => {
        strictEqual(to_extension('test/.htaccess', ''), 'test/.htaccess');
        strictEqual(to_extension('test/.htaccess', null), 'test/.htaccess');
        strictEqual(to_extension('test/.htaccess', '.txt'), 'test/.htaccess.txt');
        strictEqual(to_extension('test/.htaccess.txt', ''), 'test/.htaccess');
    });
});
