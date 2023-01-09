import { deepStrictEqual } from 'assert';
import { describe } from 'mocha';
import { get_css_path } from '../../../src/utils/css.js';

describe('utils/css/get_css_path', () => {
    it('undefined', () => {
        deepStrictEqual(get_css_path(), undefined);
    });
    it('file', () => {
        deepStrictEqual(get_css_path('file.css'), '/css/file.css');
    });
    it('file with css', () => {
        deepStrictEqual(get_css_path('css/file.css'), '/css/file.css');
    });
    it('deep file', () => {
        deepStrictEqual(get_css_path('from/here/file.css'), '/css/from/here/file.css');
    });
    it('deep file with css', () => {
        deepStrictEqual(get_css_path('css/from/here/file.css'), '/css/from/here/file.css');
    });
    it('deep file prefix /', () => {
        deepStrictEqual(get_css_path('/from/here/file.css'), '/css/from/here/file.css');
    });
    it('avoid double css at the beginning', () => {
        deepStrictEqual(get_css_path('css/from/here/file.css'), '/css/from/here/file.css');
    });
    it('avoid double css at the beginning, absolute like path', () => {
        deepStrictEqual(get_css_path('css/from/here/file.css'), '/css/from/here/file.css');
    });
    it('avoid double css at the beginning, absolute with gen', () => {
        deepStrictEqual(get_css_path('/bla/gen/css/from/here/file.css'), '/css/from/here/file.css');
    });
    it('avoid double css at the beginning, absolute with gen/src', () => {
        deepStrictEqual(get_css_path('/bla/gen/src/css/from/here/file.css'), '/css/from/here/file.css');
    });
});
