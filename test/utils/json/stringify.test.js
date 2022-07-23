import { deepStrictEqual } from 'assert';
import { stringify } from '../../../src/utils/json.js';

describe('utils/json/stringify', () => {
    it('multiple references', () => {
        const ref = { name: 'hi' };
        const data = {
            a: ref,
            b: ref,
            c: ref,
        };
        deepStrictEqual(stringify(data), JSON.stringify(data));
    });
    it('circular references', () => {
        const ref = { name: 'hi' };
        ref.self = ref;
        deepStrictEqual(stringify(ref), '{"name":"hi"}');
    });
    it('throw error', () => {
        let result = false,
            error;
        try {
            result = stringify(BigInt(10));
        } catch (e) {
            error = e.message;
        }
        deepStrictEqual(result, false);
        deepStrictEqual(error.indexOf('BigInt') > -1, true, 'error message contains BigInt');
    });
});
