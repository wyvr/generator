import { strictEqual, deepStrictEqual } from 'node:assert';
import { chmod, writeFileSync } from 'node:fs';
import { describe, it } from 'mocha';
import { rename } from '../../../src/utils/file.js';

describe('utils/file/rename', () => {
    let log, err;
    let result = [];

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
    it('undefined', () => {
        strictEqual(rename(), false);
    });
    it('non existing', () => {
        strictEqual(
            rename(
                'test/utils/file/_tests/nonexists.txt',
                'rename_nonexisting.txt'
            ),
            false
        );
    });
    it('rename', () => {
        strictEqual(
            rename(
                'test/utils/file/_tests/rename.txt',
                'renamed.txt'
            ),
            true
        );
        strictEqual(
            rename(
                'test/utils/file/_tests/renamed.txt',
                'rename.txt'
            ),
            true
        );
    });
});
