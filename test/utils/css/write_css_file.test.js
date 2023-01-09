import { deepStrictEqual } from 'assert';
import { readdirSync } from 'fs';
import { describe } from 'mocha';
import { join } from 'path';
import { EnvType } from '../../../src/struc/env.js';
import { write_css_file } from '../../../src/utils/css.js';
import { exists, remove, write } from '../../../src/utils/file.js';
import { to_dirname, to_plain } from '../../../src/utils/to.js';
import { Cwd } from '../../../src/vars/cwd.js';
import { Env } from '../../../src/vars/env.js';

describe('utils/css/write_css_file', () => {
    let log = [];
    let console_error;
    const cwd = process.cwd();
    const __dirname = join(to_dirname(import.meta.url), '_tests');
    before(() => {
        Cwd.set(__dirname);
        console_error = console.error;
        console.error = (...values) => {
            log.push(values.map(to_plain));
        };
    });
    afterEach(() => {
        log = [];
        if (exists(__dirname)) {
            readdirSync(__dirname).forEach((file) => {
                remove(join(__dirname, file));
            });
        }
    });
    after(() => {
        console_error = console.error;
        Cwd.set(undefined);
    });

    it('undefined', () => {
        deepStrictEqual(write_css_file(), {});
    });
    it('empty string', () => {
        deepStrictEqual(write_css_file(''), {});
    });

    it('split', () => {
        const file = join(__dirname, 'write.css');
        write(file, '');
        const result = write_css_file(file, 'a {color: red;} @media(min-width:1000px) {a {color:blue}}', {});
        const files = readdirSync(__dirname);
        const test = {};
        test['/' + join('css', '_tests', 'write.css')] = {
            '(min-width:1000px)': '/' + join('css', '_tests', 'write_0.css'),
        };
        deepStrictEqual(result, test);
        deepStrictEqual(files, ['write.css', 'write_0.css']);
    });
});
