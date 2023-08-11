import { deepStrictEqual, strictEqual } from 'assert';
import { describe, it } from 'mocha';
import { copy_template_file } from '../../../src/utils/create.js';
import { to_dirname, to_plain } from '../../../src/utils/to.js';
import Sinon from 'sinon';
import { join } from 'path';
import { exists, read } from '../../../src/utils/file.js';
import { rmSync } from 'fs';

describe('utils/create/copy_template_file', () => {
    const __tests = join(to_dirname(import.meta.url), '_tests');
    let sandbox;
    let log = [];
    before(() => {
        sandbox = Sinon.createSandbox();
        sandbox.stub(console, 'error');
        console.error.callsFake((...args) => {
            log.push(args.map(to_plain));
        });
    });
    afterEach(() => {
        log = [];
    });
    after(() => {
        sandbox.restore();
        if (exists(join(__tests, 'result'))) {
            rmSync(join(__tests, 'result'), { recursive: true, force: true });
        }
    });

    it('empty file', () => {
        const target = join(__tests, 'result', 'empty.html');
        copy_template_file(join(__tests, 'empty.html'), target);

        deepStrictEqual(log, [['✖', 'error reading file ' + join(__tests, 'empty.html')]]);
        deepStrictEqual(exists(target), false);
    });
    it('non existing file', () => {
        const target = join(__tests, 'result', 'nonexisting.html');
        copy_template_file(join(__tests, 'nonexisting.html'), target);

        deepStrictEqual(log, [['✖', 'error reading file ' + join(__tests, 'nonexisting.html')]]);
        deepStrictEqual(exists(target), false);
    });
    it('replace placeholders', () => {
        const target = join(__tests, 'result', 'success.html');
        copy_template_file(join(__tests, 'success.html'), target, { key: 'value' });

        deepStrictEqual(log, [['ℹ', 'created file ' + target]]);
        deepStrictEqual(exists(target), true);
        deepStrictEqual(read(target), 'TEST value');
    });
    it('with transform func', () => {
        const target = join(__tests, 'result', 'success_func.html');
        copy_template_file(join(__tests, 'success.html'), target, { key: 'value' }, (content) => {
            return content.replace('TEST', 'huhu');
        });

        deepStrictEqual(log, [['ℹ', 'created file ' + target]]);
        deepStrictEqual(exists(target), true);
        deepStrictEqual(read(target), 'huhu value');
    });
});
