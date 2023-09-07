import { deepStrictEqual } from 'assert';
import { describe, it } from 'mocha';
import { join } from 'path';
import { EnvType } from '../../../src/struc/env.js';
import { generate_page_code } from '../../../src/utils/generate.js';
import { Cwd } from '../../../src/vars/cwd.js';
import { Env } from '../../../src/vars/env.js';

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
    it('get prod page content', () => {
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
    global.getWyvrData = (segment, fallback) => {
        if(!segment || typeof segment != 'string' || !data) {
            return fallback;
        }
        return segment.split('.').reduce((acc, cur) => {
            if (typeof acc == 'object' && acc != null && !Array.isArray(acc) && acc[cur] != undefined) {
                return acc[cur];
            }
            return fallback;
        }, data);
    }
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
    it('get dev page content', () => {
        Env.set(EnvType.dev);
        const result = generate_page_code({
            _wyvr: {
                url: '/url',
                template_files: {
                    doc: join(_root, 'doc', 'Default'),
                    layout: join(_root, 'doc', 'Default'),
                    page: join(_root, 'doc', 'Default'),
                },
            },
        }).replace(/\?\d+'/g, '?[cb]\'');
        Env.value = undefined;
        deepStrictEqual(
            result,
            `
<script type="module">
    import Doc from '${process.cwd()}/test/utils/generate/_tests/generate_page_code/doc/Default?[cb]';
    import Layout from '${process.cwd()}/test/utils/generate/_tests/generate_page_code/doc/Default?[cb]';
    import Page from '${process.cwd()}/test/utils/generate/_tests/generate_page_code/doc/Default?[cb]';
    const data = {
    "_wyvr": {
        "url": "/url",
        "template_files": {
            "doc": "${process.cwd()}/test/utils/generate/_tests/generate_page_code/doc/Default",
            "layout": "${process.cwd()}/test/utils/generate/_tests/generate_page_code/doc/Default",
            "page": "${process.cwd()}/test/utils/generate/_tests/generate_page_code/doc/Default"
        }
    }
};
    global.getWyvrData = (segment, fallback) => {
        if(!segment || typeof segment != 'string' || !data) {
            return fallback;
        }
        return segment.split('.').reduce((acc, cur) => {
            if (typeof acc == 'object' && acc != null && !Array.isArray(acc) && acc[cur] != undefined) {
                return acc[cur];
            }
            return fallback;
        }, data);
    }
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
