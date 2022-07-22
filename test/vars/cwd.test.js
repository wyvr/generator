import { strictEqual } from 'assert';
import { after, describe, it } from 'mocha';
import { Cwd } from '../../src/vars/cwd.js';

describe('vars/cwd', () => {
    after(() => {
        Cwd.set(process.cwd());
    });
    it('undefined', () => {
        Cwd.set(undefined);
        strictEqual(Cwd.get(), undefined);
    });
    it('custom value', () => {
        Cwd.set('huhu');
        strictEqual(Cwd.get(), 'huhu');
    });
    it('params', () => {
        Cwd.set('huhu');
        strictEqual(Cwd.get('test','test.js'), 'huhu/test/test.js');
    });
});
