const assert = require('assert');
const link = require('./../../lib/link');

describe('Lib/Link', () => {
    describe('is_symlink', () => {
        it('no path', () => {
            assert.strictEqual(link.is_symlink(), false);
        });
        it('not existing', () => {
            assert.strictEqual(link.is_symlink('./test/lib/link/not_existing'), false);
        });
        it('no symlink folder', () => {
            assert.strictEqual(link.is_symlink('./test/lib/link/orig'), false);
        });
        it('symlink folder', () => {
            assert.strictEqual(link.is_symlink('./test/lib/link/link'), true);
        });
        it('no symlink file', () => {
            assert.strictEqual(link.is_symlink('./test/lib/link/orig.txt'), false);
        });
        it('symlink file', () => {
            assert.strictEqual(link.is_symlink('./test/lib/link/link.txt'), true);
        });
    });
});
