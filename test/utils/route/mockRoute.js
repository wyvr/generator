import { join } from 'path';
import { Route } from '../../../src/model/route.js';

const root = join(process.cwd(), 'test/utils/route/_tests/collect_routes');

export function mockRoute(path, pkg, _root) {
    const route = new Route();
    route.path = (_root ?? root) + '/' + path;
    route.rel_path = path.replace(/.*?\/routes\//, 'routes/');
    if (pkg) {
        route.pkg = pkg;
    }
    return route;
}
