require('module-alias/register');

describe('Lib/Routes', () => {
    const assert = require('assert');
    const { Routes } = require('@lib/routes');

    before(() => {
        Env.set(EnvModel.dev);
    });
});
