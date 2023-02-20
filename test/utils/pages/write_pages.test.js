import { deepStrictEqual, strictEqual } from 'assert';
import { join } from 'path';
import { Cwd } from '../../../src/vars/cwd.js';
import { write_pages } from '../../../src/utils/pages.js';
import Sinon from 'sinon';
import { to_plain } from '../../../src/utils/to.js';
import { exists, remove } from '../../../src/utils/file.js';

describe('utils/pages/write_pages', () => {
    let log = [];
    const root = join(process.cwd(), 'test/utils/pages/_tests/write_pages');

    before(() => {
        Cwd.set(root);
        Sinon.stub(console, 'error');
        console.error.callsFake((...msg) => {
            log.push(msg.map(to_plain));
        });
    });
    afterEach(() => {
        log = [];
    });
    after(() => {
        console.error.restore();
        Cwd.set(undefined);
    });
    it('undefined', () => {
        deepStrictEqual(write_pages(), []);
    });
    it('bool', () => {
        deepStrictEqual(write_pages(true), []);
    });
    it('string', () => {
        deepStrictEqual(write_pages('hello'), []);
    });
    it('number', () => {
        deepStrictEqual(write_pages(10), []);
    });
    it('empty', () => {
        deepStrictEqual(write_pages([]), []);
    });
    it('pages bool', () => {
        deepStrictEqual(write_pages([true]), []);
    });
    it('pages string', () => {
        deepStrictEqual(write_pages(['hello']), []);
    });
    it('pages number', () => {
        deepStrictEqual(write_pages([10]), []);
    });
    it('valid', () => {
        const result = write_pages([{ url: '/page-test' }]);
        deepStrictEqual(result, [root + '/gen/data/page-test/index.json']);
        result.forEach((file) => {
            strictEqual(exists(file), true);
            remove(file);
        });
    });
});