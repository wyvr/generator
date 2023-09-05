import { join } from 'path';
import { FOLDER_GEN_SERVER } from '../constants/folder.js';
import { Cwd } from '../vars/cwd.js';
import { Env } from '../vars/env.js';
import { get_cache_breaker, remove_cache_breaker } from './cache_breaker.js';
import { search_segment } from './segment.js';
import { filled_object } from './validate.js';

export function generate_page_code(data) {
    if (!filled_object(data)) {
        return undefined;
    }
    const cache_breaker = get_cache_breaker(Env.is_dev());

    const base_path = Cwd.get(FOLDER_GEN_SERVER);
    const fallback_tmpl_files = {
        doc: join(base_path, 'doc', 'Default.js'),
        layout: join(base_path, 'layout', 'Default.js'),
        page: join(base_path, 'page', 'Default.js'),
    };
    let tmpl_files = search_segment(data, '_wyvr.template_files', fallback_tmpl_files);
    if (!tmpl_files) {
        tmpl_files = {};
    }
    ['doc', 'layout', 'page'].forEach((type) => {
        if (!tmpl_files[type]) {
            tmpl_files[type] = fallback_tmpl_files[type];
        }
    });
    const code = `
<script type="module">
    import Doc from '${remove_cache_breaker(tmpl_files.doc)}${cache_breaker}';
    import Layout from '${remove_cache_breaker(tmpl_files.layout)}${cache_breaker}';
    import Page from '${remove_cache_breaker(tmpl_files.page)}${cache_breaker}';
    const data = ${JSON.stringify(data, null, Env.json_spaces())};
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
</Doc>`;
    return code;
}
