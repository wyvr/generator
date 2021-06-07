import * as fs from 'fs-extra';
import { compile, preprocess } from 'svelte/compiler';
import register from 'svelte/register';
import { Env } from './env';

register();
export class Build {
    static preprocess(content: string) {
        return preprocess(content, null, { filename: 'test' });
    }
    static compile(content: string) {
        // process.exit();
        try {
            const compiled = compile(content, {
                dev: Env.is_dev(),
                generate: 'ssr',
                format: 'cjs',
                immutable: true,
                hydratable: true,
            });
            const component = eval(compiled.js.code);
            return { compiled, component, result: null, notes: [] };
        } catch (e) {
            e.error = true;
            return e;
        }
    }
    static compile_file(filename: string) {
        const content = fs.readFileSync(filename).toString();
        const result: any = this.compile(content);
        result.filename = filename;
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
        svelte_render_item.result = svelte_render_item.component.render(props);
        // inject css
        svelte_render_item.result.html = svelte_render_item.result.html.replace('</head>', `<style>${svelte_render_item.result.css.code}</style></head>`);
        return svelte_render_item;
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
    static remove_svelte_files_from_cache() {
        Object.keys(require.cache).forEach(cache_file => {
            if(cache_file.match(/\.svelte$/)) {
                delete require.cache[cache_file];
            }
        });
    }
}
