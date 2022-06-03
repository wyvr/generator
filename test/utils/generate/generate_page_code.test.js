import { deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { join } from 'path';
import { generate_page_code } from '../../../src/utils/generate.js';
import { Cwd } from '../../../src/vars/cwd.js';

describe('utils/generate/generate_page_code', () => {
    const _root = join(process.cwd(), 'test', 'utils', 'generate', '_tests', 'generate_page_code');
    before(() => {
        Cwd.set(_root);
    });
    after(() => {
        Cwd.set(undefined);
    });
    it('undefined', () => {
        deepStrictEqual(generate_page_code(), undefined);
    });
    it('undefined', () => {
        deepStrictEqual(
            generate_page_code({
                _wyvr: {
                    url: '/url',
                    template_files: {
                        doc: join(_root, 'doc', 'Default'),
                        layout: join(_root, 'doc', 'Default'),
                        page: join(_root, 'doc', 'Default'),
                    },
                },
            }),
            '\n' +
                '<script type="module">\n' +
                "    import Doc from '/home/p/wyvr/generator/test/utils/generate/_tests/generate_page_code/doc/Default';\n" +
                "    import Layout from '/home/p/wyvr/generator/test/utils/generate/_tests/generate_page_code/doc/Default';\n" +
                "    import Page from '/home/p/wyvr/generator/test/utils/generate/_tests/generate_page_code/doc/Default';\n" +
                '    const data = {"_wyvr":{"url":"/url","template_files":{"doc":"/home/p/wyvr/generator/test/utils/generate/_tests/generate_page_code/doc/Default","layout":"/home/p/wyvr/generator/test/utils/generate/_tests/generate_page_code/doc/Default","page":"/home/p/wyvr/generator/test/utils/generate/_tests/generate_page_code/doc/Default"}}};\n' +
                '</script>\n' +
                '\n' +
                '<Doc data={data}>\n' +
                '    <Layout data={data}>\n' +
                '        <Page data={data}>\n' +
                "        {@html data.content || ''}\n" +
                '        </Page>\n' +
                '    </Layout>\n' +
                '</Doc>'
        );
    });
});
