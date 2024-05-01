import { deepStrictEqual, strictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { EnvType } from '../../../src/struc/env.js';
import { Spinner } from '../../../src/utils/spinner.js';
import { Env } from '../../../src/vars/env.js';
import { MockSpinner } from './MockSpinner.js';

describe('utils/spinner/out', () => {
    beforeEach(()=> {
        Spinner.remove_color = false;
    });
    it('undefined', () => {
        strictEqual(Spinner.out(), undefined);
    });
    it('undefined without color', () => {
        Spinner.remove_color = true;
        strictEqual(Spinner.out(), '');
    });
    it('text', () => {
        strictEqual(Spinner.out('text'), 'text');
    });
    it('text without color', () => {
        Spinner.remove_color = true;
        strictEqual(Spinner.out('text'), 'text');
    });
});
