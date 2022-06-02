import { deepStrictEqual, strictEqual } from 'assert';
import { join } from 'path';
import { Cwd } from '../../../src/vars/cwd.js';
import { write_routes } from '../../../src/utils/route.js';
import Sinon from 'sinon';
import { to_plain } from '../../../src/utils/to.js';
import { exists, remove } from '../../../src/utils/file.js';

describe('utils/route/write_routes', () => {
    let log = [];
    const root = join(process.cwd(), 'test/utils/route/_tests/write_routes');

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
        deepStrictEqual(write_routes(), []);
    });
    it('bool', () => {
        deepStrictEqual(write_routes(true), []);
    });
    it('string', () => {
        deepStrictEqual(write_routes('hello'), []);
    });
    it('number', () => {
        deepStrictEqual(write_routes(10), []);
    });
    it('empty', () => {
        deepStrictEqual(write_routes([]), []);
    });
    it('routes bool', () => {
        deepStrictEqual(write_routes([true]), []);
    });
    it('routes string', () => {
        deepStrictEqual(write_routes(['hello']), []);
    });
    it('routes number', () => {
        deepStrictEqual(write_routes([10]), []);
    });
    it('valid', () => {
        const result = write_routes([{ url: '/route-test' }]);
        deepStrictEqual(result, [root + '/gen/data/route-test/index.json']);
        result.forEach((file) => {
            strictEqual(exists(file), true);
            remove(file);
        });
    });
});