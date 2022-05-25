import { deepStrictEqual } from 'assert';
import { join } from 'path';
import { Cwd } from '../../../src/vars/cwd.js';
import { Route } from '../../../src/model/route.js';
import { collect_routes } from '../../../src/utils/route.js';
import Sinon from 'sinon';

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
    function dummyRoute(path, pkg) {
        const route = new Route();
        route.path = root + '/' + path;
        route.rel_path = path.replace(/.*?\/routes\//, 'routes/');
        if (pkg) {
            route.pkg = pkg;
        }
        return route;
    }
    before(() => {
        Cwd.set(root);
        Sinon.stub(console, 'error');
        console.error.callsFake((...msg) => {
            log.push(msg);
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
        deepStrictEqual(collect_routes(), [dummyRoute('gen/routes/route.js'), dummyRoute('gen/routes/route.md')]);
        deepStrictEqual(log, []);
    });
    it('defined folder', async () => {
        deepStrictEqual(collect_routes(join(root, 'defined')), [
            dummyRoute('defined/routes/route.js'),
            dummyRoute('defined/routes/route.md'),
        ]);
        deepStrictEqual(log, []);
    });
    it('undefined with package_tree', async () => {
        deepStrictEqual(collect_routes(undefined, package_tree), [
            dummyRoute('gen/routes/route.js', {
                name: 'Default',
                path: '/default',
            }),
            dummyRoute('gen/routes/route.md', {
                name: 'Default',
                path: '/default',
            }),
        ]);
        deepStrictEqual(log, []);
    });
    it('defined folder with package_tree', async () => {
        deepStrictEqual(collect_routes(join(root, 'defined'), package_tree), [
            dummyRoute('defined/routes/route.js', {
                name: 'Default',
                path: '/default',
            }),
            dummyRoute('defined/routes/route.md', {
                name: 'Default',
                path: '/default',
            }),
        ]);
        deepStrictEqual(log, []);
    });
});
