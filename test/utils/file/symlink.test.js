import { strictEqual, deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { remove, symlink } from '../../../src/utils/file.js';
import { v4 } from 'uuid';
import { dirname, join } from 'path';
import { existsSync, rmSync, unlinkSync, writeFileSync } from 'fs';
import { to_plain } from '../../../src/utils/to.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/file/symlink', () => {
    let log, err;
    let result = [];
    const base_report = {
        success: true,
        info: [],
        warning: [],
        error: [],
    };
    const cwd = process.cwd();

    before(() => {
        Cwd.set(cwd);
        // runs once before the first test in this block
        log = console.log;
        console.log = (...args) => {
            result.push(args.map(to_plain));
        };
        err = console.error;
        console.error = (...args) => {
            result.push(args.map(to_plain));
        };
    });
    afterEach(() => {
        result = [];
    });
    after(() => {
        // runs once after the last test in this block
        console.log = log;
        console.error = err;
        Cwd.set(undefined);
    });
    it('undefined', () => {
        strictEqual(symlink(), false);
    });
    it('non existing', () => {
        strictEqual(symlink(cwd + '/test/utils/file/_tests/nonexists.txt', cwd + '/sym_1.txt'), false);
    });
    it('symlink', () => {
        const file = cwd + '/test/utils/file/_tests/sym_2.txt';
        remove(file);
        strictEqual(symlink(cwd + '/test/utils/file/_tests/text.txt', file), true);
        remove(file);
        deepStrictEqual(result, []);
    });
    it('target not writeable', () => {
        strictEqual(symlink(cwd + '/test/utils/file/_tests/empty.txt', cwd + '/not_writeable.txt'), false);
        deepStrictEqual(result, [
            [
                '✖',
                'symlink ' +
                    cwd +
                    '/test/utils/file/_tests/empty.txt ' +
                    cwd +
                    '/not_writeable.txt {"errno":-17,"syscall":"symlink","code":"EEXIST","path":"' +
                    cwd +
                    '/test/utils/file/_tests/empty.txt","dest":"' +
                    cwd +
                    '/not_writeable.txt"}',
            ],
        ]);
    });
});
