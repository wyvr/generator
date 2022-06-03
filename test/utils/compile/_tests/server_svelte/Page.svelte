<script>
    import Doc from '[root]/test/utils/generate/_tests/generate_page_code/doc/Default.svelte';
    import Layout from '[root]/test/utils/generate/_tests/generate_page_code/doc/Default.svelte';
    import Page from '[root]/test/utils/generate/_tests/generate_page_code/doc/Default.svelte';
    const data = {
        _wyvr: {
            url: '/url',
            template_files: {
                doc: '[root]/test/utils/generate/_tests/generate_page_code/doc/Default.svelte',
                layout: '[root]/test/utils/generate/_tests/generate_page_code/doc/Default.svelte',
                page: '[root]/test/utils/generate/_tests/generate_page_code/doc/Default.svelte',
            },
        },
        content: 'hello',
    };
</script>

<Doc {data}>
    <Layout {data}>
        <Page {data}>
            {@html data.content || ''}
        </Page>
    </Layout>
</Doc>
