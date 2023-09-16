import { strictEqual } from 'assert';
import { EnvType } from '../../../src/struc/env.js';
import { add_devtools_code } from '../../../src/utils/devtools.js';
import { collect_files, remove } from '../../../src/utils/file.js';
import { Env } from '../../../src/vars/env.js';
import { Config } from '../../../src/utils/config.js';

describe('utils/devtools/add_devtools_code', () => {
    const original = Config.get();

    beforeEach(() => {
        Config.replace({ wsport: '3001' });
    });
    afterEach(() => {
        Config.replace(original);
    });
    after(() => {
        collect_files('./_tests').forEach((file) => {
            remove(file);
        });
    });
    it('undefined', () => {
        strictEqual(add_devtools_code(), '');
    });
    it('prod mode', () => {
        Env.set(EnvType.prod);
        const result = add_devtools_code('./_tests/index.html', {});
        Env.value = undefined;
        strictEqual(result, '');
    });
    it('dev mode', () => {
        Env.set(EnvType.dev);
        const result = add_devtools_code('./_tests/index.html', {_wyvr: {
            identifier: 'wyvridentifier'
        }});
        Env.value = undefined;
        strictEqual(result.indexOf('wyvr_fetch') > -1, true, 'devtools code is missing');
        strictEqual(result.indexOf('wyvr_server_communication') > -1, true, 'client socket code is missing');
        strictEqual(result.indexOf('wyvridentifier') > -1, true, 'identifier is missing');
    });
    it('dev mode without client socket code', () => {
        Config.replace(original);
        Env.set(EnvType.dev);
        const result = add_devtools_code('./_tests/index.html', {});
        Env.value = undefined;
        strictEqual(result.indexOf('wyvr_fetch') > -1, true, 'devtools code is missing');
        strictEqual(result.indexOf('wyvr_server_communication') > -1, false, 'client socket code was added');
    });
    it('dev mode for invalid paths', () => {
        Env.set(EnvType.dev);
        const result = add_devtools_code('./_tests/index.css', {});
        Env.value = undefined;
        strictEqual(result.indexOf('wyvr_fetch') > -1, false, 'devtools code was added');
        strictEqual(result.indexOf('wyvr_server_communication') > -1, false, 'client socket code was added');
    });
});
