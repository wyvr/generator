import { join } from 'path';
import { FOLDER_GEN_SERVER } from '../constants/folder.js';
import { Cwd } from '../vars/cwd.js';
import { Env } from '../vars/env.js';
import { search_segment } from './segment.js';
import { filled_object } from './validate.js';

export function generate_page_code(data) {
    if(!filled_object(data)) {
        return undefined;
    }
    const cache_breaker = Env.is_dev() ? `?${Date.now()}` : '';

    const base_path = Cwd.get(FOLDER_GEN_SERVER);
    const tmpl_files = search_segment(data, '_wyvr.template_files', {
        doc: join(base_path, 'doc', 'Default.svelte'),
        layout: join(base_path, 'layout', 'Default.svelte'),
        page: join(base_path, 'page', 'Default.svelte'),
    });

    const code = `
<script type="module">
    import Doc from '${tmpl_files.doc}${cache_breaker}';
    import Layout from '${tmpl_files.layout}${cache_breaker}';
    import Page from '${tmpl_files.page}${cache_breaker}';
    const data = ${JSON.stringify(data, null, Env.json_spaces())};
</script>

<Doc data={data}>
    <Layout data={data}>
        <Page data={data}>
        {@html data.content || ''}
        </Page>
    </Layout>
</Doc>`;
    return code;
}
