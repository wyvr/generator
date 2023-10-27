import { deepStrictEqual, strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { register_prop } from '../../../src/utils/global.js';
import { WyvrConfig } from '../../../src/model/wyvr_config.js';
import { Cwd } from '../../../src/vars/cwd.js';
import { to_dirname, to_plain } from '../../../src/utils/to.js';
import { join } from 'path';
import Sinon from 'sinon';
import { Logger } from '../../../src/utils/logger.js';
import { remove } from '../../../src/utils/file.js';
import { readdirSync } from 'fs';
import { existsSync } from 'fs';
import { ReleasePath } from '../../../src/vars/release_path.js';

describe('utils/global/register_prop', () => {
    const __dirname = join(to_dirname(import.meta.url), '_tests');

    before(() => {
        Cwd.set(__dirname);
        ReleasePath.set(join(__dirname, 'release'));
    });
    afterEach(() => {
        delete global._prop_file;
        delete global._prop;
    });
    after(() => {
        Cwd.set(undefined);
        Cwd.set(__dirname);
    });

    it('missing file', () => {
        register_prop();
        deepStrictEqual(global._prop_file, undefined);
    });
    it('set file', () => {
        register_prop('file');
        deepStrictEqual(global._prop_file, 'file');
    });
    it('set file again', () => {
        register_prop('file');
        register_prop('file1');
        deepStrictEqual(global._prop_file, 'file1');
    });
    it('generate prop', () => {
        register_prop('file');
        const folder = join(__dirname, 'gen', 'prop');
        const result = _prop('test', true);
        const prop_files = existsSync(folder) ? readdirSync(folder) : [];
        remove(folder);
        deepStrictEqual(result, '|test|:true');
        deepStrictEqual(prop_files, []);
    });
    it('generate undefined prop', () => {
        register_prop('file');
        const folder = join(__dirname, 'gen', 'prop');
        const result = _prop('test', undefined);
        const prop_files = existsSync(folder) ? readdirSync(folder) : [];
        remove(folder);
        deepStrictEqual(result, '|test|:null');
        deepStrictEqual(prop_files, []);
    });
    it('generate hugh prop as file', () => {
        register_prop('file');
        const folder = join(__dirname, 'gen', 'prop');
        const result = _prop(
            'test',
            new Array(1000).fill((_, index) => index)
        );
        const prop_files = readdirSync(folder);
        const release_folder = join(__dirname, 'release', 'prop');
        const release_files = readdirSync(release_folder);
        remove(folder);
        remove(release_folder);
        deepStrictEqual(result, '|test|:|@(/prop/test_e15dc02d8f0f43206b89309712aa26d7c644eae9fa2d6f525457d0a042dbc618.json)|');
        deepStrictEqual(prop_files, ['test_e15dc02d8f0f43206b89309712aa26d7c644eae9fa2d6f525457d0a042dbc618.json']);
        deepStrictEqual(release_files, ['test_e15dc02d8f0f43206b89309712aa26d7c644eae9fa2d6f525457d0a042dbc618.json']);
    });
    // it('missing translations with file', () => {
    //     register_prop(undefined, 'file');
    //     let result;
    //     result = _prop('test');
    //     deepStrictEqual(result, 'test');
    //     deepStrictEqual(log, ['', '', '⚠', '@inject\n[i18n] missing translations\nsource file']);
    // });
    // it('unknown key', () => {
    //     register_prop({});
    //     let result;
    //     result = _prop('test');
    //     deepStrictEqual(result, 'test');
    //     deepStrictEqual(log, ['', '', '⚠', '@inject\n[i18n] missing key "test"' ]);
    // });
    // it('unknown key with file', () => {
    //     register_prop({}, 'file');
    //     let result;
    //     result = _prop('test');
    //     deepStrictEqual(result, 'test');
    //     deepStrictEqual(log, ['', '', '⚠', '@inject\n[i18n] missing key "test"\nsource file' ]);
    // });
    // it('exists', () => {
    //     register_prop({ test: 'value' });
    //     let result;
    //     result = _prop('test');
    //     deepStrictEqual(result, 'value');
    //     deepStrictEqual(log, []);
    // });
});
