import { strictEqual, deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { package_report } from '../../../src/presentation/package_report.js';

describe('presentation/package_report/package_report', () => {
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
    });
    afterEach(() => {
        result = [];
    });
    after(() => {
        // runs once after the last test in this block
        console.log = log;
        console.error = err;
    });
    it('missing packages', () => {
        package_report();
        deepStrictEqual(result, [['\u001b[33m⚠\u001b[39m', '\u001b[33mno packages active\u001b[39m']]);
    });
    it('available packages', () => {
        package_report([{ name: 'name', path: 'path' }]);
        deepStrictEqual(result, [['\x1B[2m›\x1B[22m', 'packages \x1B[32mname\x1B[39m']]);
    });
    it('disabled packages', () => {
        package_report([], [{ name: 'name', path: 'path' }]);
        deepStrictEqual(result, [
            ['\x1B[33m⚠\x1B[39m', '\x1B[33mno packages active\x1B[39m'],
            ['\x1B[33m⚠\x1B[39m', '\x1B[33mdisabled packages name\x1B[39m'],
        ]);
    });
    it('disabled packages', () => {
        package_report(undefined, [{ name: 'name', path: 'path' }]);
        deepStrictEqual(result, [
            ['\x1B[33m⚠\x1B[39m', '\x1B[33mno packages active\x1B[39m'],
            ['\x1B[33m⚠\x1B[39m', '\x1B[33mdisabled packages name\x1B[39m'],
        ]);
    });
});
