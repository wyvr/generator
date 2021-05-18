require('module-alias/register');

const assert = require('assert');
const { Link } = require('@lib/link');
const fs = require('fs-extra');
const path = require('path');
const { v4 } = require('uuid');

describe('Lib/Link', () => {
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
    describe('to_pub', () => {
        it('empty', () => {
            assert.strictEqual(Link.to_pub(), false);
            assert.strictEqual(Link.to_pub(''), false);
            assert.strictEqual(Link.to_pub(null), false);
            assert.strictEqual(Link.to_pub(undefined), false);
            assert.strictEqual(Link.to_pub(true), false);
            assert.strictEqual(Link.to_pub(false), false);
        });
        it('create symlink', () => {
            const name = path.join(v4().split('-')[0]);
            fs.mkdirSync(name);
            Link.to_pub(name);
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
            Link.to_pub('/demo');
            assert.strictEqual(fs.existsSync('pub/demo'), true);
            assert.strictEqual(fs.readlinkSync('pub/demo'), `${process.cwd()}/demo`);
            fs.removeSync('pub/demo');
            fs.removeSync('demo');
        });
    });
});
