require('module-alias/register');

describe('Lib/Watch', () => {
    const assert = require('assert');
    const { Watch } = require('@lib/watch');

    before(() => {
        Env.set(EnvModel.dev);
    });
});
