import { strictEqual } from 'assert';
import { after, describe, it } from 'mocha';
import { join } from 'path';
import { to_dirname } from '../../src/utils/to.js';
import { WyvrPath } from '../../src/vars/wyvr_path.js';

describe('vars/wyvr_path', () => {
    const wyvr_path = join(to_dirname(import.meta.url), '..', '..', 'src');
    it('undefined', () => {
        WyvrPath.set(undefined);
        strictEqual(WyvrPath.get(), wyvr_path);
    });
    it('custom value', () => {
        WyvrPath.set('huhu');
        strictEqual(WyvrPath.get(), 'huhu');
    });
    after(() => {
        WyvrPath.value = undefined;
    });
});
