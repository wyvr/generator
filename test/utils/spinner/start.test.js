import { strictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import { EnvType } from '../../../src/struc/env.js';
import { Spinner } from '../../../src/utils/spinner.js';
import { Env } from '../../../src/vars/env.js';

describe('utils/spinner/start', () => {
    beforeEach(() => {
        Spinner.create = () => {};
        Env.set(EnvType.dev);
    });
    afterEach(() => {
        Env.set(EnvType.prod);
    });
    it('hide in prod mode', () => {
        Env.set(EnvType.prod);
        Spinner.last_text = undefined;
        Spinner.start('#');
        strictEqual(Spinner.last_text, undefined);
    });
    it('undefined', () => {
        Spinner.start();
        strictEqual(Spinner.last_text, '');
    });
    it('name', () => {
        Spinner.start('name');
        strictEqual(Spinner.last_text, 'name');
    });
});
