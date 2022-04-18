import { strictEqual } from 'assert';
import { readFileSync, rmSync } from 'fs';
import { describe, it } from 'mocha';
import { write } from '../../../src/utils/file.js';

describe('utils/file/write', () => {
    it('no filename', () => {
        strictEqual(write(), false);
    });
    it('no content', () => {
        strictEqual(write('test/utils/file/_tests/no_content.txt'), false);
    });
    it('content', () => {
        const filename = 'test/utils/file/_tests/dyn_create.txt';
        strictEqual(write(filename, 'text'), true);
        strictEqual(readFileSync(filename, { encoding: 'utf-8' }), 'text');
        rmSync(filename, { force: true });
    });
    // it('null', () => {
    //     assert.deepStrictEqual(File.write_json('test/utils/file/_tests/null'), true);
    //     assert.deepStrictEqual(read('test/utils/file/_tests/null'), 'null');
    // });
    // it('check content', () => {
    //     assert.deepStrictEqual(
    //         File.write_json('test/utils/file/_tests/check_content.json', {
    //             test: [
    //                 {
    //                     a: true,
    //                 },
    //             ],
    //         }),
    //         true
    //     );
    //     assert.deepStrictEqual(File.read('test/lib/file/check_content.json'), File.read_file('test/lib/file/check_content_result.json'));
    // });
});
