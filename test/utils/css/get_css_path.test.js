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
    it('deep file', () => {
        deepStrictEqual(get_css_path('from/here/file.css'), '/css/from/here/file.css');
    });
    it('deep file prefix /', () => {
        deepStrictEqual(get_css_path('/from/here/file.css'), '/css/from/here/file.css');
    });
});
