import { strictEqual, deepStrictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { to_html_entities } from '../../../src/utils/to.js';

describe('utils/to/to_html_entities', () => {
    it('tag', () => {
        strictEqual(to_html_entities('<br>'), '&#60;br&#62;');
    });
    it('tag self closing', () => {
        strictEqual(to_html_entities('<br />'), '&#60;br /&#62;');
    });
    it('ampersand', () => {
        strictEqual(to_html_entities('&'), '&#38;');
    });
    it('umlauts', () => {
        strictEqual(to_html_entities('äöü'), '&#228;&#246;&#252;');
    });
    it('undefined', () => {
        strictEqual(to_html_entities(), '');
    });
    it('null', () => {
        strictEqual(to_html_entities(null), '');
    });
    it('empty string', () => {
        strictEqual(to_html_entities(''), '');
    });
    it('string', () => {
        strictEqual(to_html_entities('huhu'), 'huhu');
    });
    it('string with single quote', () => {
        strictEqual(to_html_entities("hu'hu"), 'hu\'hu');
    });
    it('int', () => {
        strictEqual(to_html_entities(1), '');
    });
    it('float', () => {
        strictEqual(to_html_entities(1.1), '');
    });
    it('bigint', () => {
        strictEqual(to_html_entities(BigInt(Number.MAX_SAFE_INTEGER)), '');
    });
    it('empty array', () => {
        strictEqual(to_html_entities([]), '');
    });
    it('array', () => {
        strictEqual(to_html_entities(['a']), '');
    });
    it('empty object', () => {
        strictEqual(to_html_entities({}), '');
    });
    it('object', () => {
        strictEqual(to_html_entities({ a: true }), '');
    });
    it('boolean true', () => {
        strictEqual(to_html_entities(true), '');
    });
    it('boolean false', () => {
        strictEqual(to_html_entities(false), '');
    });
    it('symbol', () => {
        strictEqual(to_html_entities(Symbol('foo')), '');
    });
    it('date', () => {
        const date = new Date()
        strictEqual(typeof to_html_entities(date), 'string');
    });
    it('regex', () => {
        strictEqual(to_html_entities(/.*/), '');
    });
});
