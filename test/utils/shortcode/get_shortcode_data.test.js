import { deepStrictEqual } from 'node:assert';
import { join } from 'node:path';
import Sinon from 'sinon';
import { get_shortcode_data } from '../../../src/utils/shortcode.js';
import { to_plain } from '../../../src/utils/to.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/shortcode/get_shortcode_data', () => {
    let log = [];
    const root = join(process.cwd(), 'test/utils/shortcode/_tests');
    before(() => {
        Cwd.set(root);
        Sinon.stub(console, 'log');
        console.log.callsFake((...msg) => {
            log.push(msg.map(to_plain));
        });
    });
    afterEach(() => {
        log = [];
    });
    after(() => {
        Cwd.set(undefined);
        console.log.restore();
    });
    it('undefined', () => {
        deepStrictEqual(get_shortcode_data(), undefined);
        deepStrictEqual(log, []);
    });
    it('no props', () => {
        deepStrictEqual(get_shortcode_data('tag', undefined, 'file'), {
            tag: 'Tag',
            path: join(root, 'gen', 'src', 'tag.svelte'),
            props: undefined,
        });
        deepStrictEqual(log, []);
    });
    it('simple', () => {
        deepStrictEqual(get_shortcode_data('tag', 'a={true}', 'file'), {
            tag: 'Tag',
            path: join(root, 'gen', 'src', 'tag.svelte'),
            props: { a: 'true' },
        });
        deepStrictEqual(log, []);
    });
    it('path as name', () => {
        deepStrictEqual(get_shortcode_data('path/to/tag', 'a={true}', 'file'), {
            tag: 'PathToTag',
            path: join(root, 'gen', 'src', 'path', 'to', 'tag.svelte'),
            props: { a: 'true' },
        });
        deepStrictEqual(log, []);
    });
});
