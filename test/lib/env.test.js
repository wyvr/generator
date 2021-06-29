require('module-alias/register');

describe('Lib/Env', () => {
    const assert = require('assert');
    const { Env } = require('@lib/env');
    const { EnvModel } = require('@lib/model/env');

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

    describe('is_dev', () => {});
    describe('is_prod', () => {});
});
