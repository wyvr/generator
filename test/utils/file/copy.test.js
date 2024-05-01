import { strictEqual, deepStrictEqual } from 'node:assert';
import { chmod, writeFileSync } from 'node:fs';
import { describe, it } from 'mocha';
import { copy } from '../../../src/utils/file.js';

describe('utils/file/copy', () => {
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
    it('undefined', () => {
        strictEqual(copy(), false);
    });
    it('non existing', () => {
        strictEqual(copy('test/utils/file/_tests/nonexists.txt', 'test/utils/file/_tests/copy.txt'), false);
    });
    it('copy', () => {
        strictEqual(copy('test/utils/file/_tests/text.txt', 'test/utils/file/_tests/copy.txt'), true);
    });
    it('target not writeable', () => {
        strictEqual(copy('test/utils/file/_tests/empty.txt', 'test/utils/file/_tests/not_writeable.txt'), false);
        deepStrictEqual(result, [
            [
                '\x1B[31m✖\x1B[39m',
                '\x1B[31mcopy test/utils/file/_tests/empty.txt test/utils/file/_tests/not_writeable.txt {"errno":-13,"syscall":"copyfile","code":"EACCES","path":"test/utils/file/_tests/empty.txt","dest":"test/utils/file/_tests/not_writeable.txt"}\x1B[39m',
            ],
        ]);
    });
});
