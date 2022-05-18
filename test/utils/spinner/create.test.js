import { strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { EnvType } from '../../../src/struc/env.js';
import { Spinner } from '../../../src/utils/spinner.js';
import { Env } from '../../../src/vars/env.js';
import { MockSpinner } from './MockSpinner.js';

describe('utils/spinner/create', () => {
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

    it('undefined', () => {
        strictEqual(Spinner.create(), undefined);
    });
});
