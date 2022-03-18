require('module-alias/register');

describe('Lib/Dir', () => {
    const assert = require('assert');
    const fs = require('fs-extra');
    const { v4 } = require('uuid');
    const path = require('path');
    const { Dir } = require('@lib/dir');
    
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
            // create the test case
            const name = v4().split('-')[0];
            Dir.create(name);
            assert.strictEqual(fs.existsSync(name), true);
            // main work
            Dir.delete(name);
            // validate result
            assert.strictEqual(fs.existsSync(name), false);
        });
        it('deep', () => {
            // create the test case
            const name = path.join(...v4().split('-'));
            Dir.create(name);
            assert.strictEqual(fs.existsSync(name), true);
            // main work
            Dir.delete(name.split('/')[0]);
            // validate result
            assert.strictEqual(fs.existsSync(name), false);
        });
    });
    describe('clear', () => {
        it('single', () => {
            // create the test case
            const name = v4().split('-')[0];
            Dir.create(name);
            const file_path = path.join(name, 'test.txt');
            fs.writeFileSync(path.join(name, 'test.txt'), '.');
            assert.strictEqual(fs.existsSync(name), true);
            assert.strictEqual(fs.existsSync(file_path), true);
            // main work
            Dir.clear(name);
            // validate result
            assert.strictEqual(fs.existsSync(name), true);
            assert.strictEqual(fs.existsSync(file_path), false);
            fs.removeSync(name)
        });
        it('deep', () => {
            // create the test case
            const name = path.join(...v4().split('-'));
            Dir.create(name);
            const file_path = path.join(name, 'test.txt');
            fs.writeFileSync(path.join(name, 'test.txt'), '.');
            assert.strictEqual(fs.existsSync(name), true);
            assert.strictEqual(fs.existsSync(file_path), true);
            // main work
            Dir.clear(name.split('/')[0]);
            // validate result
            assert.strictEqual(fs.existsSync(name.split('/')[0]), true);
            assert.strictEqual(fs.existsSync(name), false);
            assert.strictEqual(fs.existsSync(file_path), false);
            fs.removeSync(name.split('/')[0])
        });
    });
});
