import { deepStrictEqual, strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { register_i18n } from '../../../src/utils/global.js';
import { WyvrConfig } from '../../../src/model/wyvr_config.js';
import { Cwd } from '../../../src/vars/cwd.js';
import { to_dirname, to_plain } from '../../../src/utils/to.js';
import { join } from 'path';
import Sinon from 'sinon';
import { Logger } from '../../../src/utils/logger.js';

describe('utils/global/register_i18n', () => {
    let log = [];
    let orig_log;
    before(() => {
        orig_log = Logger.output;
        Logger.output = (...args) => {
            log.push(...args.map(to_plain));
        };
    });
    afterEach(() => {
        delete global._i18n;
        delete global.__;
        log = [];
    });
    after(() => {
        Logger.output = orig_log;
    });

    it('missing translations', () => {
        register_i18n();
        let result;
        result = __('test');
        deepStrictEqual(result, 'test');
        deepStrictEqual(log, ['', '', '⚠', 'missing translations']);
    });
    it('unknown key', () => {
        register_i18n({});
        let result;
        result = __('test');
        deepStrictEqual(result, 'test');
        deepStrictEqual(log, ['', '', '⚠', 'missing key "test"']);
    });
    it('exists', () => {
        register_i18n({ test: 'value' });
        let result;
        result = __('test');
        deepStrictEqual(result, 'value');
        deepStrictEqual(log, []);
    });
});
