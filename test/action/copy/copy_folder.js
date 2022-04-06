import { strictEqual, deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { Cwd } from '../../../src/vars/cwd.js';
import { copy_folder } from '../../../src/action/copy.js';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';

describe('action/copy/copy_folder', () => {
    const __dirname = dirname(resolve(join(fileURLToPath(import.meta.url))));

    it('undefined', () => {
        const result = copy_folder();
        strictEqual(result, false);
    });
    it('empty', () => {
        const result = copy_folder('', [], '');
        strictEqual(result, false);
    });
    it('simple', () => {
        const list = [];
        const result = copy_folder(join(__dirname, '_tests'), ['simple'], join(__dirname, '_tests/_simplefolder'), (file) => {
            list.push(file);
        });
        strictEqual(result, true);
        strictEqual(list[0].src, join(__dirname, '_tests/simple/text.txt'));
    });
});
