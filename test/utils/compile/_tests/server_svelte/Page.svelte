<script>
    import Doc from '[root]/test/utils/compile/_tests/server_svelte/doc/Default.js';
    import Layout from '[root]/test/utils/compile/_tests/server_svelte/doc/Default.js';
    import Page from '[root]/test/utils/compile/_tests/server_svelte/doc/Default.js';
    import { huhu } from '[root]/test/utils/compile/_tests/server_svelte/helper/test';
    const data = {
        $wyvr: {
            url: '/url',
            template_files: {
                doc: '[root]/test/utils/compile/_tests/server_svelte/doc/Default.js',
                layout: '[root]/test/utils/compile/_tests/server_svelte/doc/Default.js',
                page: '[root]/test/utils/compile/_tests/server_svelte/doc/Default.js',
            },
        },
        content: 'hello',
    };
</script>

<Doc {data}>
    <Layout {data}>
        <Page {data}>
            {@html huhu(data.content || '')}
        </Page>
    </Layout>
</Doc>
