require('module-alias/register');

describe('Lib/Generate', () => {
    const assert = require('assert');
    const { Generate } = require('@lib/generate');

    before(() => {
        Env.set(EnvModel.dev);
    });
});
