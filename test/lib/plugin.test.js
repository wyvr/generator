require('module-alias/register');

describe('Lib/Plugin', () => {
    const assert = require('assert');
    const { Plugin } = require('@lib/plugin');

    // describe('init', async () => {
    //     Plugin.clear();
    //     Plugin.init([
    //         'nonexisting'
    //     ], {
    //         config: true,
    //     });
    //     assert.deepStrictEqual(Plugin.config, {
    //         config: true,
    //     });
    // });
    describe('clear', () => {
        Plugin.clear();
        assert.deepStrictEqual(Plugin.cache, {});
    });
    describe('before', async () => {});
    describe('after', async () => {});
    describe('build_listeners', async () => {});
});
