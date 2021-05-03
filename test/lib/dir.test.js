const assert = require('assert');
const dir = require('./../../lib/dir');
const fs = require('fs-extra');
const { v4: uuidv4} = require('uuid');
const path = require('path');

describe('Lib/Dir', () => {
    describe('create', () => {
        it('single', () => {
            const name = uuidv4().split('-')[0];
            assert.strictEqual(fs.existsSync(name), false);
            dir.create(name);
            assert.strictEqual(fs.existsSync(name), true);
            fs.removeSync(name)
        });
        it('deep', () => {
            const name = path.join(...uuidv4().split('-'));
            assert.strictEqual(fs.existsSync(name), false);
            dir.create(name);
            assert.strictEqual(fs.existsSync(name), true);
            fs.removeSync(name)
        });
    });
    describe('delete', () => {
        it('single', () => {
            const name = uuidv4().split('-')[0];
            dir.create(name);
            assert.strictEqual(fs.existsSync(name), true);
            dir.delete(name);
            assert.strictEqual(fs.existsSync(name), false);
            fs.removeSync(name)
        });
        it('deep', () => {
            const name = path.join(...uuidv4().split('-'));
            dir.create(name);
            assert.strictEqual(fs.existsSync(name), true);
            dir.delete(name);
            assert.strictEqual(fs.existsSync(name), false);
            fs.removeSync(name)
        });
    });
});
