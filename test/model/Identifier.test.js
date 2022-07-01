import { deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { kill } from 'process';
import { Identifier } from '../../src/model/identifier.js';

describe('model/identifier', () => {
    it('default values', () => {
        deepStrictEqual(Identifier(), {
            identifier: 'default',
            doc: 'Default.js',
            layout: 'Default.js',
            page: 'Default.js',
        });
    });
    it('relative paths', () => {
        deepStrictEqual(Identifier('test/Default.js', 'test/Default.js', 'test/Default.js'), {
            identifier: 'test_default-test_default-test_default',
            doc: 'test/Default.js',
            layout: 'test/Default.js',
            page: 'test/Default.js',
        });
    });
    it('doc', () => {
        deepStrictEqual(Identifier('test/Default.js', undefined, undefined), {
            identifier: 'test_default-default-default',
            doc: 'test/Default.js',
            layout: 'Default.js',
            page: 'Default.js',
        });
    });
    it('doc layout', () => {
        deepStrictEqual(Identifier('test/Default.js', 'test/Default.js', undefined), {
            identifier: 'test_default-test_default-default',
            doc: 'test/Default.js',
            layout: 'test/Default.js',
            page: 'Default.js',
        });
    });
    it('layout', () => {
        deepStrictEqual(Identifier(undefined, 'test/Default.js', undefined), {
            identifier: 'default-test_default-default',
            doc: 'Default.js',
            layout: 'test/Default.js',
            page: 'Default.js',
        });
    });
    it('layout page', () => {
        deepStrictEqual(Identifier(undefined, 'test/Default.js', 'test/Default.js'), {
            identifier: 'default-test_default-test_default',
            doc: 'Default.js',
            layout: 'test/Default.js',
            page: 'test/Default.js',
        });
    });
    it('page', () => {
        deepStrictEqual(Identifier(undefined, undefined, 'test/Default.js'), {
            identifier: 'default-default-test_default',
            doc: 'Default.js',
            layout: 'Default.js',
            page: 'test/Default.js',
        });
    });
    it('doc page', () => {
        deepStrictEqual(Identifier('test/Default.js', undefined, 'test/Default.js'), {
            identifier: 'test_default-default-test_default',
            doc: 'test/Default.js',
            layout: 'Default.js',
            page: 'test/Default.js',
        });
    });
});
