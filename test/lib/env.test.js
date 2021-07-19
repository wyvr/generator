require('module-alias/register');

describe('Lib/Env', () => {
    const assert = require('assert');
    const { Env } = require('@lib/env');
    const { EnvModel } = require('@lib/model/env');
    before(() => {
        Env.set(EnvModel.prod);
    });
    describe('get', () => {
        it('default value', () => {
            assert.strictEqual(Env.get(), EnvModel.prod);
        });
    });
    describe('set', () => {
        it('undefined', () => {
            assert.strictEqual(Env.set(undefined), EnvModel.prod);
        });
        it('null', () => {
            assert.strictEqual(Env.set(null), EnvModel.prod);
        });
        it('number', () => {
            assert.strictEqual(Env.set(3), EnvModel.prod);
        });
        it('string', () => {
            assert.strictEqual(Env.set('a'), EnvModel.prod);
        });
        it('bool', () => {
            assert.strictEqual(Env.set(true), EnvModel.prod);
            assert.strictEqual(Env.set(false), EnvModel.prod);
        });
        it('array', () => {
            assert.strictEqual(Env.set([1, 2, 3]), EnvModel.prod);
        });
        it('object', () => {
            assert.strictEqual(Env.set({ dev: true }), EnvModel.prod);
        });
        it('dev', () => {
            assert.strictEqual(Env.set(EnvModel.dev), EnvModel.dev);
            assert.strictEqual(Env.set(EnvModel[EnvModel.dev]), EnvModel.dev);
        });
        it('debug', () => {
            assert.strictEqual(Env.set(EnvModel.debug), EnvModel.debug);
            assert.strictEqual(Env.set(EnvModel[EnvModel.debug]), EnvModel.debug);
        });
        it('prod', () => {
            assert.strictEqual(Env.set(EnvModel.prod), EnvModel.prod);
            assert.strictEqual(Env.set(EnvModel[EnvModel.prod]), EnvModel.prod);
        });
    });
    describe('is_debug', () => {
        it('debug', () => {
            Env.set(EnvModel.debug);
            assert.strictEqual(Env.is_debug(), true);
        });
        it('dev', () => {
            Env.set(EnvModel.dev);
            assert.strictEqual(Env.is_debug(), true);
        });
        it('prod', () => {
            Env.set(EnvModel.prod);
            assert.strictEqual(Env.is_debug(), false);
        });
    });
    describe('is_dev', () => {
        it('debug', () => {
            Env.set(EnvModel.debug);
            assert.strictEqual(Env.is_dev(), false);
        });
        it('dev', () => {
            Env.set(EnvModel.dev);
            assert.strictEqual(Env.is_dev(), true);
        });
        it('prod', () => {
            Env.set(EnvModel.prod);
            assert.strictEqual(Env.is_dev(), false);
        });
    });
    describe('is_prod', () => {
        it('debug', () => {
            Env.set(EnvModel.debug);
            assert.strictEqual(Env.is_prod(), false);
        });
        it('dev', () => {
            Env.set(EnvModel.dev);
            assert.strictEqual(Env.is_prod(), false);
        });
        it('prod', () => {
            Env.set(EnvModel.prod);
            assert.strictEqual(Env.is_prod(), true);
        });
    });

    describe('json_spaces', () => {
        it('empty', () => {
            assert.strictEqual(Env.json_spaces(), 4);
        });
        it('null', () => {
            assert.strictEqual(Env.json_spaces(null), 4);
        });
        it('string', () => {
            assert.strictEqual(Env.json_spaces('prod'), 4);
        });
        it('bool', () => {
            assert.strictEqual(Env.json_spaces(true), 4);
        });
        it('number', () => {
            assert.strictEqual(Env.json_spaces(1), 4);
        });
        it('empty object', () => {
            assert.strictEqual(Env.json_spaces({}), 4);
        });
        it('dev', () => {
            assert.strictEqual(Env.json_spaces({ WYVR_ENV: 'dev' }), 4);
        });
        it('prod', () => {
            assert.strictEqual(Env.json_spaces({ WYVR_ENV: 'prod' }), undefined);
        });
        it('process.env', () => {
            assert.strictEqual(Env.json_spaces(process.env), 4);
        });
    });
});
