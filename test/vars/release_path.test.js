import { strictEqual } from 'node:assert';
import { after, describe, it } from 'mocha';
import { ReleasePath } from '../../src/vars/release_path.js';

describe('vars/ReleasePath', () => {
    it('undefined', () => {
        ReleasePath.set(undefined);
        strictEqual(ReleasePath.get(), undefined);
    });
    it('custom value', () => {
        ReleasePath.set('huhu');
        strictEqual(ReleasePath.get(), 'huhu');
    });
    it('params', () => {
        ReleasePath.set('huhu');
        strictEqual(ReleasePath.get('test','test.js'), 'huhu/test/test.js');
    });
    afterEach(() => {
        ReleasePath.value = undefined;
    });
});
