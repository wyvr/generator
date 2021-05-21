import * as fs from 'fs-extra';
import { compile } from 'svelte/compiler';

export class Build {
    static compile(filename) {
        const content = fs.readFileSync(filename).toString();

        // process.exit();
        const compiled = compile(content, {
            filename,
            dev: true,
            generate: 'ssr',
            format: 'cjs',
        });
        const component = eval(compiled.js.code);

        return { filename, compiled, component, result: null, notes: [] };
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
