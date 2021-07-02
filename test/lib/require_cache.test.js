const { join } = require('path');

require('module-alias/register');

describe('Lib/RequireCache', () => {
    const assert = require('assert');
    const { RequireCache } = require('@lib/require_cache');

    before(() => {});
    describe('clear', () => {
        it('contains gen files', () => {
            RequireCache.clear();
            assert(Object.keys(require.cache).find((cache_file) => cache_file.indexOf('/gen/') > -1) == null);
        });
    });
    describe('matches', () => {
        it('gen', () => {
            assert(RequireCache.matches(join(process.cwd(), 'gen/test/a')));
        });
        it('imported', () => {
            assert(RequireCache.matches(join(process.cwd(), 'imported/data/a')));
        });
    });
});
