import { strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { replace_wyvr_magic } from '../../../src/utils/transform.js';
import { Cwd } from '../../../src/vars/cwd.js';
import { Config } from '../../../src/utils/config.js';

describe('utils/transform/replace_wyvr_magic', () => {
    const test_content = `<script>import { __ } from '@wyvr/generator'; const a = isClient; const b = isServer; const a__var = [];</script><p>{isClient} thisisClient isclient {isServer} thisisServer isserver {__('translate')}</p>`;
    const original = Config.get();
    afterEach(() => {
        Config.replace(original);
    });
    it('undefined', () => {
        strictEqual(replace_wyvr_magic(), '');
    });
    it('no as_client', () => {
        strictEqual(
            replace_wyvr_magic(test_content),
            `<script> const a = false; const b = true; const a__var = [];</script><p>{false} thisisClient isclient {true} thisisServer isserver {__('translate')}</p>`
        );
    });
    it('as client', () => {
        strictEqual(
            replace_wyvr_magic(test_content, true),
            `<script> const a = true; const b = false; const a__var = [];</script><p>{true} thisisClient isclient {false} thisisServer isserver {window.__('translate')}</p>`
        );
    });
    it('as server', () => {
        strictEqual(
            replace_wyvr_magic(test_content, false),
            `<script> const a = false; const b = true; const a__var = [];</script><p>{false} thisisClient isclient {true} thisisServer isserver {__('translate')}</p>`
        );
    });
    it('injectConfig without fallback and value not found', () => {
        strictEqual(replace_wyvr_magic(`<script>const a = injectConfig('a')</script>`, false), `<script>const a = undefined</script>`);
    });
    it('injectConfig without fallback and value found', () => {
        Config.replace({ a: true });
        strictEqual(replace_wyvr_magic(`<script>const a = injectConfig('a')</script>`, false), `<script>const a = true</script>`);
    });
    it('injectConfig with fallback and value not found', () => {
        strictEqual(replace_wyvr_magic(`<script>const a = injectConfig('a', false)</script>`, false), `<script>const a = false</script>`);
    });
    it('injectConfig with fallback and value found', () => {
        Config.replace({ a: true });
        strictEqual(replace_wyvr_magic(`<script>const a = injectConfig('a', false)</script>`, false), `<script>const a = true</script>`);
    });
    it('injectConfig with string fallback and value not found', () => {
        strictEqual(replace_wyvr_magic(`<script>const a = injectConfig('a', 'false')</script>`, false), `<script>const a = 'false'</script>`);
    });
    it('injectConfig with string fallback and value found', () => {
        Config.replace({ a: true });
        strictEqual(replace_wyvr_magic(`<script>const a = injectConfig('a', 'false')</script>`, false), `<script>const a = true</script>`);
    });
    it('injectConfig multiple times', () => {
        Config.replace({ a: true });
        strictEqual(replace_wyvr_magic(`<script>const a = injectConfig('a', false) || injectConfig('b', false)</script>`, false), `<script>const a = true || false</script>`);
    });
    it('replace imports', () => {
        Config.replace({ a: true });
        strictEqual(
            replace_wyvr_magic(`<script>import a from "gen/src/file"; import b from "somewhere";</script>`),
            `<script>import a from "gen/server/file"; import b from "somewhere";</script>`
        );
    });
    it('replace imports as client', () => {
        Config.replace({ a: true });
        strictEqual(
            replace_wyvr_magic(`<script>import a from "gen/src/file"; import b from "somewhere";</script>`, true),
            `<script>import a from "gen/client/file"; import b from "somewhere";</script>`
        );
    });

    it('avoid replace universal on client', () => {
        strictEqual(
            replace_wyvr_magic(`import * as universal from "@wyvr/generator/universal.js";`, true),
            `import * as universal from "@wyvr/generator/universal.js";`
        );
    });
    it('replace universal on server', () => {
        strictEqual(
            replace_wyvr_magic(`import * as universal from "@wyvr/generator/universal.js";`, false),
            `import * as universal from "@wyvr/generator/universal_server.js";`
        );
    });
});
