const assert = require('assert');
const config = require('./../../built/config');

describe('Lib/Config', () => {
    describe('get', () => {
        it('all', () => {
            assert.strictEqual(config.get(), require('./../../config/config'));
        });
        
        it('all from cache', () => {
            config.cache = set_cache();
            assert.deepStrictEqual(config.get(), set_cache());
        });
        it('get key', () => {
            config.cache = set_cache();
            assert.strictEqual(config.get('key'), 'value');
        });
        it('get deep key', () => {
            config.cache = set_cache();
            assert.strictEqual(config.get('deep.deep.key'), 'deep value');
        });
        it('unknown key', () => {
            config.cache = set_cache();
            assert.deepStrictEqual(config.get('unknown'), null);
        });
        it('unknown deep key', () => {
            config.cache = set_cache();
            assert.deepStrictEqual(config.get('unknown.unknown.key'), null);
        });
    });
});

function set_cache() {
    return {
        key: 'value',
        deep: {
            deep: {
                key: 'deep value'
            }
        }
    };
}