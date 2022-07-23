import { deepStrictEqual } from 'assert';
import { readdirSync } from 'fs';
import { describe } from 'mocha';
import { join } from 'path';
import { get_critical_css } from '../../../src/utils/critical.js';
import { exists, remove } from '../../../src/utils/file.js';
import { to_dirname, to_plain } from '../../../src/utils/to.js';
import { Cwd } from '../../../src/vars/cwd.js';
import { ReleasePath } from '../../../src/vars/release_path.js';

describe('utils/css/get_critical_css', () => {
    let log = [];
    let console_error, console_log, write;
    const cwd = process.cwd();
    const __dirname = join(to_dirname(import.meta.url), '_tests');
    before(() => {
        Cwd.set(__dirname);
        console_error = console.error;
        console.error = (...values) => {
            log.push(values.map(to_plain));
        };
        console_log = console.log;
        console.log = (...values) => {
            log.push(values.map(to_plain));
        };
        write = process.stderr.write;
        process.stderr.write = (value) => {
            log.push(to_plain(value));
        };

        ReleasePath.set(__dirname);
    });
    afterEach(() => {
        log = [];
        if(exists(__dirname)) {
            readdirSync(__dirname).forEach((file) => {
                remove(join(__dirname, file));
            });
        }
    });
    after(() => {
        console.error = console_error;
        console.log = console_log;
        process.stderr.write = write;
        Cwd.set(undefined);
        ReleasePath.set(undefined);
    });

    it('undefined', async () => {
        deepStrictEqual(await get_critical_css(), '');
        deepStrictEqual(log, []);
    });
    it('empty string', async () => {
        deepStrictEqual(await get_critical_css(''), '');
        deepStrictEqual(log, []);
    });
    it('base html', async () => {
        deepStrictEqual(
            await get_critical_css(
                '<html><head><style>a {color:red}</style></head><body><a href="#">test</a></body></html>'
            ),
            'a{color:red}'
        );
        deepStrictEqual(log, ['Not rebasing assets for a {color:red}. Use "rebase" option\n']);
    });
    it('missing file', async () => {
        deepStrictEqual(
            await get_critical_css(
                '<html><head><link rel="stylesheet" href="test.css"></head><body><a href="#">test</a></body></html>'
            ),
            ''
        );
        deepStrictEqual(log, [['✖', '@critical\n[Error] Error: File not found: test.css']]);
    });
    it('no media query and no file', async () => {
        deepStrictEqual(await get_critical_css('a {color: red;}'), '');
    });
});
