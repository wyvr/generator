import { deepStrictEqual, strictEqual, ok } from 'assert';
import { describe, it } from 'mocha';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { inject_worker_message_errors } from '../../../src/utils/error.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/error/inject_worker_message_errors', () => {
    const __dirname = dirname(resolve(join(fileURLToPath(import.meta.url))));
    const cwd = Cwd.get();

    it('undefined', () => {
        deepStrictEqual(inject_worker_message_errors(), []);
    });
    it('empty array', () => {
        deepStrictEqual(inject_worker_message_errors([]), []);
    });
    it('no errors', () => {
        deepStrictEqual(inject_worker_message_errors(['1', '2', '3']), ['1', '2', '3']);
    });
    it('svelte errors', () => {
        deepStrictEqual(inject_worker_message_errors(['[svelte]']), ['\u001b[2m[svelte]\u001b[22m']);
    });
    it('ssr errors', () => {
        deepStrictEqual(
            inject_worker_message_errors([
                '[svelte]',
                'test',
                { code: 'parse-error', name: 'name', frame: 'frame', start: { line: 1, column: 1 } },
            ]),
            ['\u001b[2m[svelte]\u001b[22m', 'test', '\nname \x1B[2mLine:\x1B[22m1\x1B[2m Col:\x1B[22m1\nframe']
        );
    });
    it('rollup errors', () => {
        deepStrictEqual(
            inject_worker_message_errors([
                '[svelte]',
                'test',
                { code: 'PARSE_ERROR', name: 'name', loc: { file: 'file.txt', line: 1, column: 1 }, frame: 'frame' },
            ]),
            ['\u001b[2m[svelte]\u001b[22m', 'test', '\nPARSE_ERROR \x1B[2min\x1B[22m file.txt\n\x1B[2mLine:\x1B[22m1\x1B[2m Col:\x1B[22m1\nframe']
        );
    });
});
