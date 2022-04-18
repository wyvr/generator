import { strictEqual } from 'assert';
import { after, describe, it } from 'mocha';
import { Cwd } from '../../src/vars/cwd.js';

describe('vars/cwd', () => {
    it('undefined', () => {
        Cwd.set(undefined);
        strictEqual(Cwd.get(), undefined);
    });
    it('custom value', () => {
        Cwd.set('huhu');
        strictEqual(Cwd.get(), 'huhu');
    });
    after(() => {
        Cwd.set(process.cwd());
    });
});
