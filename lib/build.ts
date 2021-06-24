import * as fs from 'fs-extra';
import { compile, preprocess } from 'svelte/compiler';
import register from 'svelte/register';
import { Client } from './client';
import { Env } from './env';

register();
// onServer Server implementation
(<any>global).onServer = async (callback: Function) => {
    if (callback && typeof callback == 'function') {
        await callback();
    }
};
export class Build {
    static preprocess(content: string) {
        return preprocess(content, null, { filename: 'test' });
    }
    static compile(content: string): [any, any] {
        // process.exit();
        try {
            const compiled = compile(content, {
                dev: Env.is_dev(),
                generate: 'ssr',
                format: 'cjs',
                immutable: true,
                hydratable: true,
                cssHash: Client.css_hash,
            });
            const component = eval(compiled.js.code);
            return [null, { compiled, component, result: null, notes: [] }];
        } catch (e) {
            return [e, null];
        }
    }
    static compile_file(filename: string): [any, any] {
        const content = fs.readFileSync(filename).toString();
        const result: [any, any] = this.compile(content);
        // result.filename = filename;
        return result;
    }
    static render(svelte_render_item, props) {
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
            svelte_render_item.result = svelte_render_item.component.render(props);
        } catch (e) {
            return [e, null];
        }
        // inject css
        svelte_render_item.result.html = svelte_render_item.result.html.replace('</head>', `<style>${svelte_render_item.result.css.code}</style></head>`);
        return [null, svelte_render_item];
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
            const data = ${JSON.stringify(data)};
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
    static get_entrypoint_code(doc_file_name: string, layout_file_name: string, page_file_name: string) {
        const code = `<script>
            import { onMount } from 'svelte';
            import Doc from '${doc_file_name}';
            import Layout from '${layout_file_name}';
            import Page from '${page_file_name}';
            const data = null;
        </script>

        <Doc data={data}>
            <Layout data={data}>
                <Page data={data}>
                here
                </Page>
            </Layout>
        </Doc>`;
        return code;
    }
}
