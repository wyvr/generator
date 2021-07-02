require('module-alias/register');

describe('Lib/Dependency', () => {
    const assert = require('assert');
    const { Dependency } = require('@lib/dependency');

    before(() => {
        Env.set(EnvModel.dev);
    });
});
