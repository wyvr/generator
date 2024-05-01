import { deepStrictEqual } from 'node:assert';
import { readdirSync } from 'node:fs';
import { describe } from 'mocha';
import { join } from 'node:path';
import { EnvType } from '../../../src/struc/env.js';
import { split_css_into_media_query_files } from '../../../src/utils/css.js';
import { exists, remove, write } from '../../../src/utils/file.js';
import { to_dirname, to_plain } from '../../../src/utils/to.js';
import { Cwd } from '../../../src/vars/cwd.js';
import { Env } from '../../../src/vars/env.js';

describe('utils/css/split_css_into_media_query_files', () => {
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

    it('ignore in dev env', () => {
        Env.set(EnvType.dev);
        deepStrictEqual(split_css_into_media_query_files(), undefined);
        Env.set(EnvType.prod);
    });
    it('undefined', () => {
        deepStrictEqual(split_css_into_media_query_files(), {});
    });
    it('empty string', () => {
        deepStrictEqual(split_css_into_media_query_files(''), {});
    });
    it('no media query and no file', () => {
        deepStrictEqual(split_css_into_media_query_files('a {color: red;}'), {});
    });
    it('no file', () => {
        deepStrictEqual(
            split_css_into_media_query_files('a {color: red;} @media(min-width:1000px) {a {color:blue}}'),
            {}
        );
    });
    it('file does not exist', () => {
        const file = join(__dirname, 'split.css');
        const result = split_css_into_media_query_files(
            'a {color: red;} @media(min-width:1000px) {a {color:blue}}',
            file
        );
        const files = readdirSync(__dirname);
        deepStrictEqual(result, {});
        deepStrictEqual(files, []);
    });
    it('split', () => {
        const file = join(__dirname, 'split.css');
        write(file, '');
        const result = split_css_into_media_query_files(
            'a {color: red;} @media(min-width:1000px) {a {color:blue}}',
            file
        );
        const files = readdirSync(__dirname);
        deepStrictEqual(result, {
            '(min-width:1000px)': '/' + join('css', '_tests', 'split_0.css'),
        });
        deepStrictEqual(files, ['split.css', 'split_0.css']);
    });
});
