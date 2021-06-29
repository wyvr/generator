require('module-alias/register');

describe('Lib/Config', () => {
    const assert = require('assert');
    const { Config } = require('@lib/config');

    describe('get', () => {
        it('all', () => {
            const config_keys = Object.keys(Config.get());
            const must_have_keys = Object.keys(require('../../config/config'));
            assert.deepStrictEqual(config_keys, must_have_keys);
        });

        it('all from cache', () => {
            Config.cache = set_cache();
            assert.deepStrictEqual(Config.get(), set_cache());
        });
        it('get key', () => {
            Config.cache = set_cache();
            assert.strictEqual(Config.get('key'), 'value');
        });
        it('get deep key', () => {
            Config.cache = set_cache();
            assert.strictEqual(Config.get('deep.deep.key'), 'deep value');
        });
        it('unknown key', () => {
            Config.cache = set_cache();
            assert.deepStrictEqual(Config.get('unknown'), null);
        });
        it('unknown deep key', () => {
            Config.cache = set_cache();
            assert.deepStrictEqual(Config.get('unknown.unknown.key'), null);
        });
    });
    describe('load_from_path', () => {
        it('exists', () => {
            assert.deepStrictEqual(Config.load_from_path(''), require('../../wyvr.js'));
        });
        it('does not exists', () => {
            assert.deepStrictEqual(Config.load_from_path('..'), null);
        });
    });
    describe('set', () => {
        it('unchanged', () => {
            Config.cache = set_cache();
            assert.deepStrictEqual(Config.set(null), false);
            assert.deepStrictEqual(Config.cache, set_cache());
        });
        it('change', () => {
            Config.cache = set_cache();
            assert.deepStrictEqual(Config.set({ key: 'changed' }), true);
            const cache = set_cache();
            cache.key = 'changed';
            assert.deepStrictEqual(Config.cache, cache);
        });
        it('change deep', () => {
            Config.cache = set_cache();
            assert.deepStrictEqual(Config.set({ deep: { deep: { key: 'changed' } } }), true);
            const cache = set_cache();
            cache.deep.deep.key = 'changed';
            assert.deepStrictEqual(Config.cache, cache);
        });
        it('add', () => {
            Config.cache = set_cache();
            assert.deepStrictEqual(Config.set({ new_key: 'new' }), true);
            const cache = set_cache();
            cache.new_key = 'new';
            assert.deepStrictEqual(Config.cache, cache);
        });
        it('add deep', () => {
            Config.cache = set_cache();
            assert.deepStrictEqual(Config.set({ new_deep: { new_deep: { new_key: 'changed' } } }), true);
            const cache = set_cache();
            cache.new_deep = { new_deep: { new_key: 'changed' } };
            assert.deepStrictEqual(Config.cache, cache);
        });
    });
});

function set_cache() {
    return {
        key: 'value',
        deep: {
            deep: {
                key: 'deep value',
            },
        },
    };
}
