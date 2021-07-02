require('module-alias/register');

describe('Lib/Publish', () => {
    const assert = require('assert');
    const { Publish } = require('@lib/publish');

    before(() => {
        Env.set(EnvModel.dev);
    });
});
