import { deepStrictEqual, strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { compile_typescript } from '../../../src/utils/compile.js';
import { to_plain } from '../../../src/utils/to.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/to/compile_typescript', () => {
    let log = [];
    let console_error;
    beforeEach(() => {
        Cwd.set(process.cwd());
        console_error = console.error;
        console.error = (...values) => {
            log.push(values.map(to_plain));
        };
    });
    afterEach(() => {
        log = [];
        console_error = console.error;
        Cwd.set(undefined);
    });

    it('undefined', async () => {
        strictEqual(await compile_typescript(), undefined);
    });
    it('valid code', async () => {
        const result = await compile_typescript(`function add(left: number, right: number): number {
            return left + right;
        }`);
        strictEqual(result, 'function add(left, right) {\n  return left + right;\n}\n');
    });
    it('error with filename', async () => {
        strictEqual(
            await compile_typescript(
                `function add(left: number, right: number): number {
            return left + right;
        `,
                'test.ts'
            ),
            undefined
        );
        deepStrictEqual(log, [
            [
                '✖',
                '@typescript\n' +
                    '[Error] Transform failed with 1 error:\n' +
                    'stack\n' +
                    '- 3:8: ERROR: Unexpected end of file\n' +
                    'source test.ts',
            ],
        ]);
    });
    it('error without filename', async () => {
        strictEqual(
            await compile_typescript(
                `function add(left: number, right: number): number {
            return left + right;
        `
            ),
            undefined
        );
        deepStrictEqual(log, [
            [
                '✖',
                '@typescript\n' +
                    '[Error] Transform failed with 1 error:\n' +
                    'stack\n' +
                    '- 3:8: ERROR: Unexpected end of file',
            ],
        ]);
    });
});
