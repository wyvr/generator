const assert = require('assert');
const link = require('./../../lib/link');
const fs = require('fs-extra');
const path = require('path');
const { v4 } = require('uuid');

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
    describe('to_pub', () => {
        it('empty', () => {
            assert.strictEqual(link.to_pub(), false);
            assert.strictEqual(link.to_pub(''), false);
            assert.strictEqual(link.to_pub(null), false);
            assert.strictEqual(link.to_pub(undefined), false);
            assert.strictEqual(link.to_pub(true), false);
            assert.strictEqual(link.to_pub(false), false);
        });
        it('recursion', () => {
            const name = path.join(v4().split('-')[0]);
            fs.mkdirSync(name);
            fs.symlinkSync(name, `pub/${name}`);
            link.to_pub(name);
            assert.strictEqual(fs.existsSync(`pub/${name}`), true);
            assert.strictEqual(fs.readlinkSync(`pub/${name}`), `${process.cwd()}/${name}`);
            fs.removeSync(name);
            fs.removeSync(`pub/${name}`);
        });
        it('create symlink', () => {
            const name = path.join(v4().split('-')[0]);
            fs.mkdirSync(name);
            link.to_pub(name);
            assert.strictEqual(fs.existsSync(`pub/${name}`), true);
            assert.strictEqual(fs.readlinkSync(`pub/${name}`), `${process.cwd()}/${name}`);
            fs.removeSync(name);
            fs.removeSync(`pub/${name}`);
        });
        it('recreate symlink', () => {});
        it('remove root', () => {
            fs.removeSync('demo');
            fs.removeSync('pub/demo');
            fs.mkdirSync('demo');
            link.to_pub('/demo');
            assert.strictEqual(fs.existsSync('pub/demo'), true);
            assert.strictEqual(fs.readlinkSync('pub/demo'), `${process.cwd()}/demo`);
            fs.removeSync('pub/demo');
            fs.removeSync('demo');
        });
    });
});
