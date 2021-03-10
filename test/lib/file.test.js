const assert = require('assert');
const file = require('_lib/file');

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
});
