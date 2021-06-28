require('module-alias/register');

describe('Lib/Link', () => {
    const assert = require('assert');
    const { Link } = require('@lib/link');
    const fs = require('fs-extra');
    const path = require('path');
    const { v4 } = require('uuid');

    describe('is_symlink', () => {
        it('no path', () => {
            assert.strictEqual(Link.is_symlink(), false);
        });
        it('not existing', () => {
            assert.strictEqual(Link.is_symlink('./test/lib/link/not_existing'), false);
        });
        it('no symlink folder', () => {
            assert.strictEqual(Link.is_symlink('./test/lib/link/orig'), false);
        });
        it('symlink folder', () => {
            assert.strictEqual(Link.is_symlink('./test/lib/link/link'), true);
        });
        it('no symlink file', () => {
            assert.strictEqual(Link.is_symlink('./test/lib/link/orig.txt'), false);
        });
        it('symlink file', () => {
            assert.strictEqual(Link.is_symlink('./test/lib/link/link.txt'), true);
        });
    });
    describe('to', () => {
        it('empty', () => {
            assert.strictEqual(Link.to(), false);
            assert.strictEqual(Link.to(''), false);
            assert.strictEqual(Link.to(null), false);
            assert.strictEqual(Link.to(undefined), false);
            assert.strictEqual(Link.to(true), false);
            assert.strictEqual(Link.to(false), false);
            assert.strictEqual(Link.to(false, undefined), false);
            assert.strictEqual(Link.to(false, null), false);
            assert.strictEqual(Link.to(false, ''), false);
            assert.strictEqual(Link.to(false, 0), false);
        });
        it('create symlink', () => {
            const name = path.join(v4().split('-')[0]);
            fs.mkdirSync(name);
            Link.to(name, '_/' + name);
            assert.strictEqual(fs.existsSync('_/' + name), true);
            assert.strictEqual(fs.readlinkSync('_/' + name), `${process.cwd()}/${name}`);
            fs.removeSync(name);
            fs.removeSync('_/' + name);
        });
        it('recreate symlink', () => {

        });
        it('remove root', () => {
            fs.removeSync('demo');
            fs.removeSync('_/demo');
            fs.mkdirSync('demo');
            Link.to('/demo', '_/demo');
            assert.strictEqual(fs.existsSync('_/demo'), true);
            assert.strictEqual(fs.readlinkSync('_/demo'), `${process.cwd()}/demo`);
            fs.removeSync('_/demo');
            fs.removeSync('demo');
        });
    });
});
