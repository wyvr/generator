require('module-alias/register');

describe('Lib/Config', () => {
    const assert = require('assert');
    const { Config } = require('@lib/config');
    
    describe('get', () => {
        it('all', () => {
            const config_keys = Object.keys(Config.get());
            const must_have_keys = Object.keys(require('./../../config/config'));
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
