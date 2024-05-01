import { deepStrictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { set_cookie } from '../../../src/utils/cookies.js';

describe('utils/cookies/set_cookie', () => {
    it('cookie with default options', () => {
        deepStrictEqual(set_cookie('my_cookie', 'my_value'), 'my_cookie=my_value; Path=/; SameSite=Strict; Secure; HttpOnly;');
    });
    it('cookie with custom options', () => {
        deepStrictEqual(
            set_cookie('my_cookie', 'my_value', {
                Path: '/my-path',
                SameSite: 'Lax',
            }),
            'my_cookie=my_value; Path=/my-path; SameSite=Lax; Secure; HttpOnly;'
        );
    });
    it('cookie with custom options but invalid samesite value', () => {
        deepStrictEqual(
            set_cookie('my_cookie', 'my_value', {
                Path: '/my-path',
                SameSite: 'value',
            }),
            'my_cookie=my_value; Path=/my-path; Secure; HttpOnly;'
        );
    });
    it('delete a cookie', () => {
        deepStrictEqual(set_cookie('my_cookie', undefined), 'my_cookie=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Strict; Secure; HttpOnly;');
    });
    it('delete a cookie without httponly', () => {
        deepStrictEqual(set_cookie('my_cookie', undefined, { HttpOnly: false }), 'my_cookie=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Strict; Secure;');
    });
});
