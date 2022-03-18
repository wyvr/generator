require('module-alias/register');

describe('Lib/Link', () => {
    const assert = require('assert');
    const { Link } = require('@lib/link');

    before(() => {
        Env.set(EnvModel.dev);
    });
});
