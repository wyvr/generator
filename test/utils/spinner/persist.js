import { deepStrictEqual, strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { EnvType } from '../../../src/struc/env.js';
import { Spinner } from '../../../src/utils/spinner.js';
import { Env } from '../../../src/vars/env.js';
import { MockSpinner } from './MockSpinner.js';

describe('utils/spinner/persist', () => {
    let result;

    beforeEach(() => {
        Env.set(EnvType.dev);
        Spinner.spinner = MockSpinner((data) => {
            result = data;
        });
    });
    afterEach(() => {
        Env.set(EnvType.prod);
        Spinner.spinner = undefined;
        result = undefined;
    });

    it('no spinner', () => {
        Spinner.spinner = undefined;
        const has_spinner = Spinner.persist('#', 'text');
        strictEqual(has_spinner, false);
        deepStrictEqual(result, undefined);
    });
    it('has spinner', () => {
        const has_spinner = Spinner.persist('#', 'text');
        strictEqual(has_spinner, true);
        deepStrictEqual(result, {
            symbol: '#',
            text: 'text',
        });
    });
});
