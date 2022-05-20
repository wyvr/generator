import { strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { replace_wyvr_magic } from '../../../src/utils/transform.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/transform/replace_wyvr_magic', () => {
    const test_content = `<script>import { __ } from '@wyvr/generator'; const a = isClient; const b = isServer; const a__var = [];</script><p>{isClient} thisisClient isclient {isServer} thisisServer isserver {__('translate')}</p>`;
    it('undefined', () => {
        strictEqual(replace_wyvr_magic(), '');
    });
    it('no as_client', () => {
        strictEqual(replace_wyvr_magic(test_content), `<script> const a = false; const b = true; const a__var = [];</script><p>{false} thisisClient isclient {true} thisisServer isserver {__('translate')}</p>`);
    });
    it('as client', () => {
        strictEqual(replace_wyvr_magic(test_content, true), `<script> const a = true; const b = false; const a__var = [];</script><p>{true} thisisClient isclient {false} thisisServer isserver {window.__('translate')}</p>`);
    });
    it('as server', () => {
        strictEqual(replace_wyvr_magic(test_content, false), `<script> const a = false; const b = true; const a__var = [];</script><p>{false} thisisClient isclient {true} thisisServer isserver {__('translate')}</p>`);
    });
    
});
