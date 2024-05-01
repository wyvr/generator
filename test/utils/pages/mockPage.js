import { join } from 'node:path';
import { FOLDER_PAGES } from '../../../src/constants/folder.js';
import { Page } from '../../../src/model/page.js';

const root = join(process.cwd(), 'test/utils/pages/_tests/collect_pages');

export function mockPage(path, pkg, _root) {
    const page = new Page();
    page.path = (_root ?? root) + '/' + path;
    page.rel_path = path.replace(new RegExp(`.*/${FOLDER_PAGES}/`), 'pages/');
    if (pkg) {
        page.pkg = pkg;
    }
    return page;
}
