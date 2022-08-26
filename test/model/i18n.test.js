import { deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { I18N } from '../../src/model/i18n.js';

describe('model/i18n', () => {
    it('undefined', () => {
        const i18n = new I18N();
        deepStrictEqual(i18n.data, undefined);
    });
    it('translation on create', () => {
        const i18n = new I18N({
            test: 'Test',
        });
        deepStrictEqual(i18n.data, {
            test: 'Test',
        });
    });
    describe('set', () => {
        it('translation after create', () => {
            const i18n = new I18N();
            i18n.set({
                test: 'Test',
            });
            deepStrictEqual(i18n.data, {
                test: 'Test',
            });
        });
    });
    describe('tr', () => {
        it('missing data', () => {
            const i18n = new I18N();
            deepStrictEqual(i18n.tr('huhu'), 'huhu');
        });
        it('missing key', () => {
            const i18n = new I18N({
                test: 'Test',
            });
            deepStrictEqual(i18n.tr('huhu'), 'huhu');
        });
        it('key found', () => {
            const i18n = new I18N({
                test: 'Test',
            });
            deepStrictEqual(i18n.tr('test'), 'Test');
        });
        it('replace option', () => {
            const i18n = new I18N({
                test: 'Test {key}',
            });
            deepStrictEqual(i18n.tr('test', { key: 'key' }), 'Test key');
        });
        it('replace dead markers', () => {
            const i18n = new I18N({
                test: 'Test {dead} {key}',
            });
            deepStrictEqual(i18n.tr('test', { key: 'key' }), 'Test  key');
        });
        it('replace object', () => {
            const i18n = new I18N({
                test: 'Test {object}',
            });
            deepStrictEqual(i18n.tr('test', { object: { key: 'value' } }), 'Test {"key":"value"}');
        });
        it('replace complex data', () => {
            const i18n = new I18N({
                test: 'Test {string} {number} {object} {null}',
            });
            deepStrictEqual(
                i18n.tr('test', { string: 'huhu', number: 2.3, object: { key: 'value' }, null: null }),
                'Test huhu 2.3 {"key":"value"} null'
            );
        });
        it('replace plural', () => {
            const i18n = new I18N({
                test: {
                    _: 'all',
                    1: 'one',
                },
            });
            deepStrictEqual(i18n.tr('test', { count: 1 }), 'one');
            deepStrictEqual(i18n.tr('test', { count: 2 }), 'all');
        });
    });
    describe('plural', () => {
        it('plural no object', () => {
            const i18n = new I18N();
            deepStrictEqual(i18n.plural('test'), 'test');
        });
        it('plural no count', () => {
            const i18n = new I18N();
            deepStrictEqual(
                i18n.plural({
                    _: 'all',
                    1: 'one',
                }),
                'all'
            );
        });
        it('plural no count no all', () => {
            const i18n = new I18N();
            deepStrictEqual(
                i18n.plural({
                    1: 'one',
                }),
                ''
            );
        });
        it('plural exact match', () => {
            const i18n = new I18N();
            deepStrictEqual(
                i18n.plural(
                    {
                        _: 'all',
                        1: 'one',
                    },
                    { count: 1 }
                ),
                'one'
            );
        });
        it('plural no exact match', () => {
            const i18n = new I18N();
            deepStrictEqual(
                i18n.plural(
                    {
                        _: 'all',
                        1: 'one',
                    },
                    { count: 2 }
                ),
                'all'
            );
        });
        it('plural no all and lighter and greater available', () => {
            const i18n = new I18N();
            deepStrictEqual(
                i18n.plural(
                    {
                        '<100': 'nope1',
                        '>100': 'nope2',
                    },
                    { count: 100 }
                ),
                ''
            );
        });
        it('plural found greater', () => {
            const i18n = new I18N();
            deepStrictEqual(
                i18n.plural(
                    {
                        _: 'all',
                        '>100': 'one',
                        '>1000': 'two',
                    },
                    { count: 1000 }
                ),
                'one'
            );
        });
        it('plural found lighter', () => {
            const i18n = new I18N();
            deepStrictEqual(
                i18n.plural(
                    {
                        _: 'all',
                        '<100': 'one',
                        '>100': 'nope1',
                        '>1000': 'nope2',
                    },
                    { count: 10 }
                ),
                'one'
            );
        });
    });
    describe('get_error', () => {
        it('no error', () => {
            const i18n = new I18N({ test: 'Test' });
            deepStrictEqual(i18n.get_error('test'), undefined);
        });
        it('get error missing count prop', () => {
            const i18n = new I18N({
                huhu: {
                    _: 'test',
                },
            });
            deepStrictEqual(i18n.get_error('huhu', { count: 1 }), undefined);
        });
        it('get error missing translations', () => {
            const i18n = new I18N();
            deepStrictEqual(i18n.get_error(), 'missing translations');
        });
        it('get error missing key', () => {
            const i18n = new I18N({ test: 'test' });
            deepStrictEqual(i18n.get_error(), 'missing key "undefined"');
        });
        it('get error unknown key', () => {
            const i18n = new I18N({ test: 'test' });
            deepStrictEqual(i18n.get_error('huhu'), 'missing key "huhu"');
        });
        it('get error missing count prop', () => {
            const i18n = new I18N({
                huhu: {
                    _: 'test',
                },
            });
            deepStrictEqual(i18n.get_error('huhu'), 'missing "count" option for key "huhu"');
        });
    });
});
