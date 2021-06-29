require('module-alias/register');

describe('Lib/Model/Wyvr/File', () => {
    const assert = require('assert');
    const { WyvrFile, WyvrFileConfig } = require('@lib/model/wyvr/file');

    describe('WyvrFile', () => {
        it('empty/null constructor', () => {
            assert.deepStrictEqual(new WyvrFile().path, null);
            assert.deepStrictEqual(new WyvrFile(null).path, null);
            assert.deepStrictEqual(new WyvrFile(undefined).path, null);
            assert.deepStrictEqual(new WyvrFile(false).path, null);
        });
        it('invalid constructor', () => {
            assert.deepStrictEqual(new WyvrFile(true).path, null);
        });
        it('reserved keyword', () => {
            const file = new WyvrFile('abstract.svelte');
            assert.deepStrictEqual(file.path, 'abstract.svelte');
            assert.deepStrictEqual(file.name, '_abstract');
        });
        it('reserved keyword in folder', () => {
            const file = new WyvrFile('folder/abstract.svelte');
            assert.deepStrictEqual(file.path, 'folder/abstract.svelte');
            assert.deepStrictEqual(file.name, '_abstract');
        });
    });
    describe('WyvrFileConfig', () => {
        it('check default values', () => {
            const config = new WyvrFileConfig();
            config.key = true;
            assert.strictEqual(config.display, 'block');
            assert.strictEqual(config.render, 'static');
            assert.strictEqual(config.loading, 'instant');
            assert.strictEqual(config.error, undefined);
            assert.strictEqual(config.portal, undefined);
            assert.strictEqual(config.key, true);
        });
    });
});
