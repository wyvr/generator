import { strictEqual, deepStrictEqual } from 'assert';
import { rmSync } from 'fs';
import { describe, it } from 'mocha';
import { write_json, read } from '../../../src/utils/file.js';

describe('utils/file/write_json', () => {
    it('no filename', () => {
        strictEqual(write_json(), false);
    });
    it('null', () => {
        strictEqual(write_json('test/utils/file/_tests/null'), true);
        strictEqual(read('test/utils/file/_tests/null'), 'null');
    });
    it('check content', () => {
        const filename = 'test/utils/file/_tests/check_content.json';
        deepStrictEqual(
            write_json(filename, {
                test: [
                    {
                        a: true,
                    },
                ],
            }),
            true
        );
        deepStrictEqual(read(filename), read('test/utils/file/_tests/check_content_result.json'));
        rmSync(filename);
    });
    it('check array content', () => {
        const filename = 'test/utils/file/_tests/check_array_content.json';
        deepStrictEqual(
            write_json(filename, [
                {
                    a: true,
                },
            ]),
            true
        );
        deepStrictEqual(read(filename), read('test/utils/file/_tests/check_array_content_result.json'));
        rmSync(filename);
    });
});
