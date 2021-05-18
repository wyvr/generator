const assert = require('assert');
const dir = require('./../../built/dir');
const fs = require('fs-extra');
const { v4 } = require('uuid');
const path = require('path');

describe('Lib/Dir', () => {
    describe('create', () => {
        it('single', () => {
            const name = v4().split('-')[0];
            assert.strictEqual(fs.existsSync(name), false);
            dir.create(name);
            assert.strictEqual(fs.existsSync(name), true);
            fs.removeSync(name)
            assert.strictEqual(fs.existsSync(name), false);
        });
        it('deep', () => {
            const name = path.join(...v4().split('-'));
            assert.strictEqual(fs.existsSync(name), false);
            dir.create(name);
            assert.strictEqual(fs.existsSync(name), true);
            fs.removeSync(name.split('/')[0])
            assert.strictEqual(fs.existsSync(name), false);
        });
    });
    describe('delete', () => {
        it('single', () => {
            const name = v4().split('-')[0];
            dir.create(name);
            assert.strictEqual(fs.existsSync(name), true);
            dir.delete(name);
            assert.strictEqual(fs.existsSync(name), false);
        });
        it('deep', () => {
            const name = path.join(...v4().split('-'));
            dir.create(name);
            assert.strictEqual(fs.existsSync(name), true);
            dir.delete(name.split('/')[0]);
            assert.strictEqual(fs.existsSync(name), false);
        });
    });
});
