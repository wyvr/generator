import { deepStrictEqual, strictEqual } from 'node:assert';
import { join } from 'node:path';
import { Cwd } from '../../../src/vars/cwd.js';
import { get_page_data_path, write_pages } from '../../../src/utils/pages.js';
import Sinon from 'sinon';
import { to_plain } from '../../../src/utils/to.js';
import { exists, remove } from '../../../src/utils/file.js';

describe('utils/pages/get_page_data_path', () => {
    let log = [];
    const root = join(process.cwd(), 'test/utils/pages/_tests/get_page_data_path');

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
        strictEqual(get_page_data_path(), undefined);
    });
    it('empty object', () => {
        strictEqual(get_page_data_path({}), undefined);
    });
    it('wrong url', () => {
        strictEqual(get_page_data_path({ url: true }), undefined);
    });
    it('valid', () => {
        strictEqual(get_page_data_path({ url: 'huhu' }), join(root, 'gen/data/huhu/index.json'));
    });
});
