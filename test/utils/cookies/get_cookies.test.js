import { strictEqual, deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { get_cookies } from '../../../src/utils/cookies.js';

describe('utils/cookies/get_cookies', () => {
    it('should return an empty object if cookie_string is not provided', () => {
        const result = get_cookies();
        deepStrictEqual(result, {});
    });

    it('should return an empty object if cookie_string is not a string', () => {
        const result = get_cookies(123);
        deepStrictEqual(result, {});
    });

    it('should return an empty object if cookie_string is an empty string', () => {
        const result = get_cookies('');
        deepStrictEqual(result, {});
    });

    it('should parse a single boolean cookie', () => {
        const result = get_cookies('boolean_cookie');
        deepStrictEqual(result, { boolean_cookie: true });
    });

    it('should parse a single cookie', () => {
        const result = get_cookies('name=value');
        deepStrictEqual(result, { name: 'value' });
    });

    it('should parse multiple cookies', () => {
        const result = get_cookies('name1=value1; name2=value2; name3=value3');
        deepStrictEqual(result, { name1: 'value1', name2: 'value2', name3: 'value3' });
    });

    it('should handle boolean cookies', () => {
        const result = get_cookies('cookie1; cookie2; cookie3');
        deepStrictEqual(result, { cookie1: true, cookie2: true, cookie3: true });
    });

    it('should trim whitespace around cookie keys and values', () => {
        const result = get_cookies('  name1  =  value1  ;  name2  =  value2  ');
        deepStrictEqual(result, { name1: 'value1', name2: 'value2' });
    });
});
