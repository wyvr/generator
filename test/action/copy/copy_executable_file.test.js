import { strictEqual, deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { copy_executable_file } from '../../../src/action/copy.js';
import { join } from 'path';
import { to_dirname } from '../../../src/utils/to.js';
import { read, remove } from '../../../src/utils/file.js';

describe('action/copy/copy_executable_file', () => {
    const __dirname = to_dirname(import.meta.url);

    it('undefined', () => {
        const result = copy_executable_file();
        strictEqual(result, false);
    });
    it('empty', () => {
        const result = copy_executable_file('', '');
        strictEqual(result, false);
    });
    it('cron file', () => {
        const result = copy_executable_file(
            join(__dirname, '_tests', 'cron', 'text.txt'),
            join(__dirname, '_tests', '_cron', 'text.txt')
        );
        ///home/p/wyvr/generator/test/action/copy/_tests/cron/text.txt
        strictEqual(result, true);
        strictEqual(read(join(__dirname, '_tests', '_cron', 'text.txt')), '"undefined/gen/src/"');
    });
    it('no executeable file', () => {
        const result = copy_executable_file(
            join(__dirname, '_tests', 'simple', 'text.txt'),
            join(__dirname, '_tests', '_simple', 'text_cron.txt')
        );
        strictEqual(result, false);
    });
    after(() => {
        remove(join(__dirname, '_tests', '_cron', 'text.txt'));
        remove(join(__dirname, '_tests', '_simple', 'text_cron.txt'));
    });
});
