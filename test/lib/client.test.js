require('module-alias/register');

describe('Lib/Client', () => {
    const assert = require('assert');
    const { Client } = require('@lib/client');

    before(() => {
        Env.set(EnvModel.dev);
    });
});
