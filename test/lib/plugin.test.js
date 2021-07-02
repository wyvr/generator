require('module-alias/register');

describe('Lib/Plugin', () => {
    const assert = require('assert');
    const { Plugin } = require('@lib/plugin');

    before(() => {
        Env.set(EnvModel.dev);
    });
});
