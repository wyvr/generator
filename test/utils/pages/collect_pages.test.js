import { deepStrictEqual } from 'node:assert';
import { join } from 'node:path';
import { Cwd } from '../../../src/vars/cwd.js';
import { collect_pages } from '../../../src/utils/pages.js';
import Sinon from 'sinon';
import { mockPage } from './mockPage.js';
import { to_plain } from '../../../src/utils/to.js';

describe('utils/pages/collect_pages', () => {
    let log = [];
    const root = join(process.cwd(), 'test/utils/pages/_tests/collect_pages');
    const package_tree = {};
    package_tree['pages/page.js'] = {
        name: 'Default',
        path: '/default',
    };
    package_tree['pages/page.md'] = {
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
        deepStrictEqual(collect_pages('nonexisting'), []);
        deepStrictEqual(log, []);
    });
    it('undefined', async () => {
        deepStrictEqual(collect_pages(), [mockPage('gen/pages/page.js'), mockPage('gen/pages/page.md')]);
        deepStrictEqual(log, []);
    });
    it('defined folder', async () => {
        deepStrictEqual(collect_pages(join(root, 'defined')), [
            mockPage('defined/pages/page.js'),
            mockPage('defined/pages/page.md'),
        ]);
        deepStrictEqual(log, []);
    });
    it('undefined with package_tree', async () => {
        deepStrictEqual(collect_pages(undefined, package_tree), [
            mockPage('gen/pages/page.js', {
                name: 'Default',
                path: '/default',
            }),
            mockPage('gen/pages/page.md', {
                name: 'Default',
                path: '/default',
            }),
        ]);
        deepStrictEqual(log, []);
    });
    it('defined folder with package_tree', async () => {
        deepStrictEqual(collect_pages(join(root, 'defined'), package_tree), [
            mockPage('defined/pages/page.js', {
                name: 'Default',
                path: '/default',
            }),
            mockPage('defined/pages/page.md', {
                name: 'Default',
                path: '/default',
            }),
        ]);
        deepStrictEqual(log, []);
    });
});
