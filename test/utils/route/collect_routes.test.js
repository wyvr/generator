import { deepStrictEqual } from 'assert';
import { join } from 'path';
import { Cwd } from '../../../src/vars/cwd.js';
import { collect_routes } from '../../../src/utils/route.js';
import Sinon from 'sinon';
import { mockRoute } from './mockRoute.js';
import { to_plain } from '../../../src/utils/to.js';

describe('utils/route/collect_routes', () => {
    let log = [];
    const root = join(process.cwd(), 'test/utils/route/_tests/collect_routes');
    const package_tree = {};
    package_tree['routes/route.js'] = {
        name: 'Default',
        path: '/default',
    };
    package_tree['routes/route.md'] = {
        name: 'Default',
        path: '/default',
    };
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
    it('non existing', async () => {
        deepStrictEqual(collect_routes('nonexisting'), []);
        deepStrictEqual(log, []);
    });
    it('undefined', async () => {
        deepStrictEqual(collect_routes(), [mockRoute('gen/routes/route.js'), mockRoute('gen/routes/route.md')]);
        deepStrictEqual(log, []);
    });
    it('defined folder', async () => {
        deepStrictEqual(collect_routes(join(root, 'defined')), [
            mockRoute('defined/routes/route.js'),
            mockRoute('defined/routes/route.md'),
        ]);
        deepStrictEqual(log, []);
    });
    it('undefined with package_tree', async () => {
        deepStrictEqual(collect_routes(undefined, package_tree), [
            mockRoute('gen/routes/route.js', {
                name: 'Default',
                path: '/default',
            }),
            mockRoute('gen/routes/route.md', {
                name: 'Default',
                path: '/default',
            }),
        ]);
        deepStrictEqual(log, []);
    });
    it('defined folder with package_tree', async () => {
        deepStrictEqual(collect_routes(join(root, 'defined'), package_tree), [
            mockRoute('defined/routes/route.js', {
                name: 'Default',
                path: '/default',
            }),
            mockRoute('defined/routes/route.md', {
                name: 'Default',
                path: '/default',
            }),
        ]);
        deepStrictEqual(log, []);
    });
});
