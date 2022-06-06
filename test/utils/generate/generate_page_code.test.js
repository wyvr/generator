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
            `
<script type="module">
    import Doc from '${process.cwd()}/test/utils/generate/_tests/generate_page_code/doc/Default';
    import Layout from '${process.cwd()}/test/utils/generate/_tests/generate_page_code/doc/Default';
    import Page from '${process.cwd()}/test/utils/generate/_tests/generate_page_code/doc/Default';
    const data = {"_wyvr":{"url":"/url","template_files":{"doc":"${process.cwd()}/test/utils/generate/_tests/generate_page_code/doc/Default","layout":"${process.cwd()}/test/utils/generate/_tests/generate_page_code/doc/Default","page":"${process.cwd()}/test/utils/generate/_tests/generate_page_code/doc/Default"}}};
</script>

<Doc data={data}>
    <Layout data={data}>
        <Page data={data}>
        {@html data.content || ''}
        </Page>
    </Layout>
</Doc>`
        );
    });
});
