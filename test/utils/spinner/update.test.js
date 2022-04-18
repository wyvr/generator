import { deepStrictEqual, strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { EnvType } from '../../../src/struc/env.js';
import { Spinner } from '../../../src/utils/spinner.js';
import { Env } from '../../../src/vars/env.js';
import { MockSpinner } from './MockSpinner.js';

describe('utils/spinner/update', () => {
    let spinner;
    let result;

    beforeEach(() => {
        Env.set(EnvType.dev);
        spinner = Spinner.spinner;
        Spinner.spinner = MockSpinner((data) => {
            result = data;
        });
    });
    afterEach(() => {
        Env.set(EnvType.prod);
        Spinner.spinner = spinner;
        result = undefined;
    });

    it('no spinner', () => {
        Spinner.spinner = undefined;
        Spinner.last_text = undefined;
        Spinner.update('text', 500);
        strictEqual(Spinner.last_text, undefined);
    });
    it('has spinner', () => {
        Spinner.update('text', 500);
        strictEqual(Spinner.last_text, 'text');
    });
});
