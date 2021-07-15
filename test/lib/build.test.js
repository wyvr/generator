require('module-alias/register');

describe('Lib/Build', () => {
    const assert = require('assert');
    const { Build } = require('@lib/build');
    const { Env } = require('@lib/env');
    const { EnvModel } = require('@lib/model/env');

    before(() => {
        Env.set(EnvModel.dev);
    });
    describe('onServer', () => {
        it('empty', async () => {
            let result = false;
            await global.onServer(async () => {
                result = await new Promise(function (resolve) {
                    setTimeout(function () {
                        resolve(true);
                    }, 10);
                });
            });
            assert.strictEqual(result, true);
        });
    });
    describe('compile', () => {
        it('undefined', () => {
            assert.deepStrictEqual(Build.compile(), [new Error('content has to be a string'), null]);
            assert.deepStrictEqual(Build.compile(undefined), [new Error('content has to be a string'), null]);
        });
        it('empty', () => {
            assert.deepStrictEqual(Build.compile(''), [new Error('content has to be a string'), null]);
        });
        it('number', () => {
            assert.deepStrictEqual(Build.compile(1), [new Error('content has to be a string'), null]);
        });
        it('bool', () => {
            assert.deepStrictEqual(Build.compile(true), [new Error('content has to be a string'), null]);
        });
        it('array', () => {
            assert.deepStrictEqual(Build.compile(['a', 'b']), [new Error('content has to be a string'), null]);
        });
        it('object', () => {
            assert.deepStrictEqual(Build.compile({ content: '' }), [new Error('content has to be a string'), null]);
        });
        it('template', () => {
            const result = Build.compile(`
            <script>let name='wyvr';</script>
            <p>Hello {name}</p>
            <style>p {color:red;}</style>`);
            assert.strictEqual(result[0], null);
            assert.match(result[1].compiled.js.code, /"wyvr"/);
            assert.match(result[1].compiled.css.code, /color:red/);
        });
        it('broken template', () => {
            const result = Build.compile(`
            <script>let n=wyvr;</script>
            <p>Hello {nam}</p>
            <style>p {a{color:red}}</style>`);
            assert.match(result[0].message, /Colon is expected/);
            assert.strictEqual(result[1], null);
        });
    });
    describe('render', () => {});
    describe('precompile_components', () => {});
    describe('get_page_code', () => {});
});
