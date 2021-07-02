require('module-alias/register');

describe('Lib/Optimize', () => {
    const assert = require('assert');
    const { Optimize } = require('@lib/optimize');

    before(() => {
        Env.set(EnvModel.dev);
    });
});
