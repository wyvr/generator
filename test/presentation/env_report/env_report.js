import { strictEqual, deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { Cwd } from '../../../src/vars/cwd.js';
import { env_report } from '../../../src/presentation/env_report.js';
import { ERRORS } from '../../../src/constants/errors.js';
import Sinon from 'sinon';

describe('presentation/env_report/env_report', () => {
    let log, err;
    let result = [];
    const base_report = {
        success: true,
        info: [],
        warning: [],
        error: [],
    };

    before(() => {
        // runs once before the first test in this block
        log = console.log;
        console.log = (...args) => {
            result.push(args);
        };
        err = console.error;
        console.error = (...args) => {
            result.push(args);
        };
        Sinon.stub(process, 'exit');
    });
    afterEach(() => {
        result = [];
    });
    after(() => {
        // runs once after the last test in this block
        console.log = log;
        console.error = err;
        process.exit.restore();
    });
    it('missing report', () => {
        env_report();
        deepStrictEqual(result, [['\x1B[31m✖\x1B[39m', '\x1B[31m\x1B[39m']]);
    });
    it('succeed', () => {
        env_report(base_report);
        deepStrictEqual(result, []);
    });
    it('has infos', () => {
        env_report(Object.assign({}, base_report, { info: ['a', 'b'] }));
        deepStrictEqual(result, [
            ['\u001b[34mℹ\u001b[39m', 'a'],
            ['\u001b[34mℹ\u001b[39m', 'b'],
        ]);
    });
    it('has warnings', () => {
        env_report(Object.assign({}, base_report, { warning: ['a', 'b'] }));
        deepStrictEqual(result, [
            ['\u001b[33m⚠\u001b[39m', '\u001b[33ma\u001b[39m'],
            ['\u001b[33m⚠\u001b[39m', '\u001b[33mb\u001b[39m'],
        ]);
    });
    it('has errors', () => {
        env_report(Object.assign({}, base_report, { error: ['a', 'b'] }));
        deepStrictEqual(result, [
            ['\x1B[31m✖\x1B[39m', '\x1B[31ma\x1B[39m'],
            ['\x1B[31m✖\x1B[39m', '\x1B[31mb\x1B[39m'],
        ]);
    });
    it('critical', () => {
        env_report(Object.assign({}, base_report, { success: false }));
        deepStrictEqual(result, [
            ['\u001b[31m✖\u001b[39m', '\u001b[31mterminated wyvr because of critical errors\u001b[39m'],
        ]);
    });
});
