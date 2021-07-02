require('module-alias/register');

describe('Lib/Events', () => {
    const assert = require('assert');
    const { Events } = require('@lib/events');

    before(() => {
        Env.set(EnvModel.dev);
    });
});
