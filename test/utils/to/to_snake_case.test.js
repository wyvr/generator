import { strictEqual, deepStrictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { to_snake_case } from '../../../src/utils/to.js';

describe('utils/to/to_snake_case', () => {
    it('undefined', () => {
        strictEqual(to_snake_case(), undefined);
    });
    it('null', () => {
        strictEqual(to_snake_case(null), undefined);
    });
    it('empty string', () => {
        strictEqual(to_snake_case(''), undefined);
    });
    it('string', () => {
        strictEqual(to_snake_case('huhu'), 'huhu');
    });
    it('string Pascal case', () => {
        strictEqual(to_snake_case('HuHu'), 'hu_hu');
    });
    it('string Camel case', () => {
        strictEqual(to_snake_case('huHu'), 'hu_hu');
    });
    it('string Snake case', () => {
        strictEqual(to_snake_case('hu_hu'), 'hu_hu');
    });
    it('string Kebab case', () => {
        strictEqual(to_snake_case('hu-hu'), 'hu_hu');
    });
    it('string mixed cases', () => {
        strictEqual(to_snake_case('Hu-_-Hu'), 'hu_hu');
    });
    it('int', () => {
        strictEqual(to_snake_case(1), undefined);
    });
    it('float', () => {
        strictEqual(to_snake_case(1.1), undefined);
    });
    it('bigint', () => {
        strictEqual(to_snake_case(BigInt(Number.MAX_SAFE_INTEGER)), undefined);
    });
    it('empty array', () => {
        strictEqual(to_snake_case([]), undefined);
    });
    it('array', () => {
        strictEqual(to_snake_case(['a']), undefined);
    });
    it('empty object', () => {
        strictEqual(to_snake_case({}), undefined);
    });
    it('object', () => {
        strictEqual(to_snake_case({ a: true }), undefined);
    });
    it('boolean true', () => {
        strictEqual(to_snake_case(true), undefined);
    });
    it('boolean false', () => {
        strictEqual(to_snake_case(false), undefined);
    });
    it('symbol', () => {
        strictEqual(to_snake_case(Symbol('foo')), undefined);
    });
    it('date', () => {
        strictEqual(to_snake_case(new Date()), undefined);
    });
    it('regex', () => {
        strictEqual(to_snake_case(/.*/), undefined);
    });
});
