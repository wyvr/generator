import * as fs from 'fs-extra';
import { join, dirname } from 'path';
import { compile } from 'svelte/compiler';
import register from 'svelte/register';
import { Client } from '@lib/client';
import { Env } from '@lib/env';

register();
// fix intl global on the server side
(<any>global).Intl = require('intl');
// onServer Server implementation
(<any>global).onServer = async (callback: Function) => {
    if (callback && typeof callback == 'function') {
        return await callback();
    }
    return null;
};
export class Build {
    static async compile(content: string): Promise<[any, any]> {
        if (!content || typeof content != 'string') {
            return [new Error('content has to be a string'), null];
        }
        try {
            const compiled = await compile(content, {
                dev: Env.is_dev(),
                generate: 'ssr',
                format: 'cjs',
                immutable: true,
                hydratable: true,
                cssHash: Client.css_hash,
            });
            const component = await eval(compiled.js.code);
            return [null, { compiled, component, result: null, notes: [] }];
        } catch (e) {
            return [e, null];
        }
    }
    static async render(svelte_render_item, props) {
        const propNames = Object.keys(props);
        if (Array.isArray(propNames) && Array.isArray(svelte_render_item.compiled.vars)) {
            // check for not used props
            const unused_props = propNames.filter((prop) => {
                return (
                    svelte_render_item.compiled.vars.find((v) => {
                        return v.name == prop;
                    }) == null
                );
            });
            if (unused_props.length > 0) {
                svelte_render_item.notes.push({ msg: 'unused props', details: unused_props });
            }
        }
        try {
            svelte_render_item.result = await svelte_render_item.component.render(props);
        } catch (e) {
            return [e, null];
        }
        // write css file
        const css_file_path = join('gen', 'css', `${props._wyvr.identifier}.css`);
        let identifier_item = { url: props.url, identifier: props._wyvr.identifier, extension: props._wyvr.extension };
        if (!fs.existsSync(css_file_path)) {
            this.write_css_file(css_file_path, svelte_render_item.result.css.code);
        } else {
            const last_modified = fs.statSync(css_file_path).mtime;
            // changes in the time range of 5 seconds avoids recreation of css files
            // @WARN when hugh amounts of data gets generated css files can be written multiple times
            if(new Date().getTime() - new Date(last_modified).getTime() > 5000) {
                this.write_css_file(css_file_path, svelte_render_item.result.css.code);
            }
        }
        // inject css
        // svelte_render_item.result.html = svelte_render_item.result.html.replace('</head>', `<style>${svelte_render_item.result.css.code}</style></head>`);
        return [null, svelte_render_item, identifier_item];
    }
    // write css file
    static write_css_file(css_file_path: string, css_code: string) {
        fs.mkdirSync(dirname(css_file_path), { recursive: true });
        fs.writeFileSync(css_file_path, css_code);
    }
    // precompile the components to check whether there is only global data used
    static precompile_components() {
        //@TODO implement
    }
    static get_page_code(data: any, doc_file_name: string, layout_file_name: string, page_file_name: string) {
        const code = `
        <script>
            import Doc from '${doc_file_name}';
            import Layout from '${layout_file_name}';
            import Page from '${page_file_name}';
            const data = ${JSON.stringify(data, null, Env.json_spaces(process.env))};
        </script>

        <Doc data={data}>
            <Layout data={data}>
                <Page data={data}>
                ${data.content || ''}
                </Page>
            </Layout>
        </Doc>`;
        return code;
    }
}
