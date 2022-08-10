import { strictEqual } from 'assert';
import { EnvType } from '../../../src/struc/env.js';
import { add_debug_code } from '../../../src/utils/debug.js';
import { collect_files, remove } from '../../../src/utils/file.js';
import { Env } from '../../../src/vars/env.js';

describe('utils/debug/add_debug_code', () => {
    after(() => {
        collect_files('./_tests').forEach((file)=> {
            remove(file)
        })
    });
    it('undefined', () => {
        strictEqual(add_debug_code(), '');
    });
    it('prod mode', () => {
        Env.set(EnvType.prod);
        const result = add_debug_code('<html><body></body></html>', './_tests/index.html', {});
        Env.value = undefined;
        strictEqual(result, '<html><body></body></html>');
    });
    it('contains debug script', () => {
        Env.set(EnvType.dev);
        const result = add_debug_code('<html><body></body></html>', './_tests/index.html', {});
        Env.value = undefined;
        strictEqual(result.indexOf(`<html><body><script>`) > -1, true, 'contains start script\n'+ result);
        strictEqual(result.indexOf(`</script>\n</body></html>`) > -1, true, 'contains end script\n'+ result);
        strictEqual(result.indexOf(`window.data = await wyvr_fetch('./_tests/index.json');`) > -1, true, 'contains fetch data\n'+ result);
        strictEqual(result.indexOf(`window.structure = await wyvr_fetch('/undefined.json');`) > -1, true, 'contains fetch structure\n'+ result);
    });
    it('contains debug script with data', () => {
        Env.set(EnvType.dev);
        const result = add_debug_code('<html><body></body></html>', './_tests/index.html', {_wyvr: {identifier:'a-b-c'}});
        Env.value = undefined;
        strictEqual(result.indexOf(`window.structure = await wyvr_fetch('/a-b-c.json');`) > -1, true, 'contains fetch structure\n'+ result);
        strictEqual(result.indexOf(`const shortcode_path = './_tests/index.html';`) > -1, true, 'contains shortcode path\n'+ result);
    });
});
