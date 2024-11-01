import { join } from 'node:path';
import { Cwd } from '../../vars/cwd.js';
import { copy_template_file, inset } from '../create.js';
import { read } from '../file.js';
import { to_tabbed } from '../to.js';

export function create_file(templates, version, result) {
    let wyvr_split_css = '';
    let wyvr_split_js = '';
    let wyvr_code = '';
    let wyvr_imports = '';
    let wyvr_file_config = '';

    wyvr_split_css = inset(read(join(templates, 'file', 'file.css')).replace(/\/\*.*?\*\//g, ''));
    wyvr_split_js = inset(read(join(templates, 'file', 'file.js')).replace(/\/\*.*?\*\//g, ''));

    wyvr_imports += to_tabbed([[`import { onServer } from 'wyvr';`], '']);
    if (result.wyvr_render !== 'static') {
        const features = [`render: '${result.wyvr_render}'`, `loading: '${result.wyvr_loading}'`];
        if (result.wyvr_loading === 'media') {
            features.push(`media: '${result.wyvr_media}'`);
        }
        if (result.wyvr_loading === 'none') {
            features.push(`trigger: '${result.wyvr_trigger}'`);
        }
        wyvr_file_config = to_tabbed([['wyvr: {', features, '}']]);

        wyvr_imports += to_tabbed([[`import { onMount } from 'svelte';`]]);
        wyvr_code += to_tabbed([['onMount(() => {', ['// executed only on client / CSR', `value = 'client';`], '})'], '']);
    }
    wyvr_code += to_tabbed([['onServer(() => {', ['// executed only on server / SSR', `value = 'server';`], '})']]);

    copy_template_file(join(templates, 'file', 'file.svelte'), Cwd.get('src', `${result.name}.svelte`), {
        version,
        wyvr_imports,
        wyvr_file_config,
        wyvr_split_css,
        wyvr_split_js,
        wyvr_code
    });
}
