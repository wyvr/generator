import { strictEqual, deepStrictEqual } from 'node:assert';
import { describe, it } from 'mocha';
import Sinon from 'sinon';
import { package_report } from '../../../src/presentation/package_report.js';
import { to_plain } from '../../../src/utils/to.js';

describe('presentation/package_report/package_report', () => {
    let log, err;
    let result = [];
    let exit_value;
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
            result.push(args.map(to_plain));
        };
        err = console.error;
        console.error = (...args) => {
            result.push(args.map(to_plain));
        };
        Sinon.stub(process, 'exit');
        process.exit.callsFake((code) => {
            exit_value = code;
        });
    });
    afterEach(() => {
        result = [];
        exit_value = undefined;
    });
    after(() => {
        // runs once after the last test in this block
        console.log = log;
        console.error = err;
        process.exit.restore();
    });
    it('missing packages', () => {
        package_report();
        deepStrictEqual(result, [['✖', 'no packages active']]);
        deepStrictEqual(exit_value, 1);
    });
    it('available packages', () => {
        package_report([{ name: 'name', path: 'path' }]);
        deepStrictEqual(result, [['›', 'packages name']]);
    });
    it('disabled packages', () => {
        package_report([], [{ name: 'name', path: 'path' }]);
        deepStrictEqual(result, [
            ['✖', 'no packages active'],
            ['⚠', 'disabled packages name'],
        ]);
    });
    it('disabled packages', () => {
        package_report(undefined, [{ name: 'name', path: 'path' }]);
        deepStrictEqual(result, [
            ['✖', 'no packages active'],
            ['⚠', 'disabled packages name'],
        ]);
    });
});
