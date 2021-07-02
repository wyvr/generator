require('module-alias/register');

describe('Lib/RequireCache', () => {
    const assert = require('assert');
    const { RequireCache } = require('@lib/require_cache');

    before(() => {
        Env.set(EnvModel.dev);
    });
});
