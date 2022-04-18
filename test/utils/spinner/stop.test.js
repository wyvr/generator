import { deepStrictEqual, strictEqual } from 'assert';
import kleur from 'kleur';
import { describe, it } from 'mocha';
import { EnvType } from '../../../src/struc/env.js';
import { Spinner } from '../../../src/utils/spinner.js';
import { Env } from '../../../src/vars/env.js';
import { MockSpinner } from './MockSpinner.js';

describe('utils/spinner/stop', () => {
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
        Spinner.last_text = undefined;
        result = undefined;
    });
    
    it('undefined', () => {
        Env.set(EnvType.prod);
        Spinner.spinner = undefined;
        const message = Spinner.stop();
        strictEqual(message, `${kleur.green('✓')} ${kleur.green('')} ${kleur.dim('...................................')}`);
    });
    it('env prod + no spinner', () => {
        Env.set(EnvType.prod);
        Spinner.spinner = undefined;
        const message = Spinner.stop('text', 500);
        strictEqual(message, `${kleur.green('✓')} ${kleur.green('text')} ${kleur.dim('............................')} 500 ${kleur.dim('ms')}`);
    });
    it('too long text', () => {
        Env.set(EnvType.prod);
        Spinner.spinner = undefined;
        const text = 'this is some too long text for the spinner to display in the given format';
        const message = Spinner.stop(text, 500);
        strictEqual(message, `${kleur.green('✓')} ${kleur.green(text)} ${kleur.dim('')} 500 ${kleur.dim('ms')}`);
    });
});
