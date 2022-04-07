import { strictEqual } from 'assert';
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
    afterEach(() => {
        ReleasePath.value = undefined;
    });
});
