import * as fs from 'fs-extra';
import { compile, preprocess } from 'svelte/compiler';
import * as register from 'svelte/register';

register()
export class Build {
    static preprocess(content: string) {
        return preprocess(content, null, {filename: 'test'});
    }
    static compile(content: string) {
        // process.exit();
        const compiled = compile(content, {
            dev: true,
            generate: 'ssr',
            format: 'cjs',
            immutable: true
        });
        const component = eval(compiled.js.code);

        return { compiled, component, result: null, notes: [] };
    }
    static compile_file(filename: string) {
        const content = fs.readFileSync(filename).toString();
        const result:any = this.compile(content);
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
        return svelte_render_item;
    }
    // precompile the components to check whether there is only global data used
    static precompile_components() {
        //@TODO implement
    }
}
