import { strictEqual } from 'assert';
import { after, describe, it } from 'mocha';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { WyvrPath } from '../../src/vars/wyvr_path.js';

describe('vars/wyvr_path', () => {
    const wvyr_path = join(dirname(resolve(fileURLToPath(import.meta.url))), '..', '..', 'src');
    it('undefined', () => {
        WyvrPath.set(undefined);
        strictEqual(WyvrPath.get(), wvyr_path);
    });
    it('custom value', () => {
        WyvrPath.set('huhu');
        strictEqual(WyvrPath.get(), 'huhu');
    });
    after(() => {
        WyvrPath.value = undefined;
    });
});
