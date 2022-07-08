import { strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { is_path } from '../../../src/utils/validate.js';

describe('utils/validate/is_path', () => {
    it('undefined', () => {
        strictEqual(is_path(), false);
    });
    it('null', () => {
        strictEqual(is_path(null), false);
    });
    it('empty string', () => {
        strictEqual(is_path(''), false);
    });
    it('string', () => {
        strictEqual(is_path('huhu'), false);
    });
    it('int', () => {
        strictEqual(is_path(1), false);
    });
    it('float', () => {
        strictEqual(is_path(1.1), false);
    });
    it('bigint', () => {
        strictEqual(is_path(BigInt(Number.MAX_SAFE_INTEGER)), false);
    });
    it('empty array', () => {
        strictEqual(is_path([]), false);
    });
    it('array', () => {
        strictEqual(is_path(['a']), false);
    });
    it('empty object', () => {
        strictEqual(is_path({}), false);
    });
    it('object', () => {
        strictEqual(is_path({ a: true }), false);
    });
    it('boolean true', () => {
        strictEqual(is_path(true), false);
    });
    it('boolean false', () => {
        strictEqual(is_path(false), false);
    });
    it('symbol', () => {
        strictEqual(is_path(Symbol('foo')), false);
    });
    it('date', () => {
        strictEqual(is_path(new Date()), false);
    });
    it('regex', () => {
        strictEqual(is_path(/.*/), false);
    });
    it('buffer', () => {
        strictEqual(is_path(Buffer.from([])), false);
    });
    it('function', () => {
        strictEqual(
            is_path(() => {}),
            false
        );
    });
    it('@src', () => {
        strictEqual(is_path('@src/file'), true);
    });
    it('@src deep', () => {
        strictEqual(is_path('@src/file/file.js'), true);
    });
    it('relative', () => {
        strictEqual(is_path('./src/file/file.js'), true);
    });
    it('absolute', () => {
        strictEqual(is_path('/src/file/file.js'), true);
    });
});
