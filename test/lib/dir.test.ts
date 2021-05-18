require('module-alias/register');

const assert = require('assert');
const fs = require('fs-extra');
const { v4 } = require('uuid');
const path = require('path');

const { Dir } = require('@lib/dir');

describe('Lib/Dir', () => {
    describe('create', () => {
        it('single', () => {
            const name = v4().split('-')[0];
            assert.strictEqual(fs.existsSync(name), false);
            Dir.create(name);
            assert.strictEqual(fs.existsSync(name), true);
            fs.removeSync(name);
            assert.strictEqual(fs.existsSync(name), false);
        });
        it('deep', () => {
            const name = path.join(...v4().split('-'));
            assert.strictEqual(fs.existsSync(name), false);
            Dir.create(name);
            assert.strictEqual(fs.existsSync(name), true);
            fs.removeSync(name.split('/')[0]);
            assert.strictEqual(fs.existsSync(name), false);
        });
    });
    describe('delete', () => {
        it('single', () => {
            const name = v4().split('-')[0];
            Dir.create(name);
            assert.strictEqual(fs.existsSync(name), true);
            Dir.delete(name);
            assert.strictEqual(fs.existsSync(name), false);
        });
        it('deep', () => {
            const name = path.join(...v4().split('-'));
            Dir.create(name);
            assert.strictEqual(fs.existsSync(name), true);
            Dir.delete(name.split('/')[0]);
            assert.strictEqual(fs.existsSync(name), false);
        });
    });
});
