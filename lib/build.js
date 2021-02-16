const fs = require('fs');
const compiler = require('svelte/compiler');

module.exports = {
    compile(filename) {
        const content = fs.readFileSync(filename).toString();

        // process.exit();
        const compiled = compiler.compile(content, {
            filename,
            dev: true,
            generate: 'ssr',
            hydratable: true,
            format: 'cjs',
        });
        const component = eval(compiled.js.code);
        return { filename, compiled, component, result: null, notes: [] };
    },
    render(svelte_render_item, props) {
        const propNames = Object.keys(props);
        if(Array.isArray(propNames) && Array.isArray(svelte_render_item.compiled.vars)) {
            // check for not used props
            const unused_props = propNames.filter((prop)=>{
                return svelte_render_item.compiled.vars.find((v)=>{
                    return v.name == prop;
                }) == null;
            })
            if(unused_props.length > 0) {
                svelte_render_item.notes.push({msg: 'unused props', details: unused_props})
            }
        }
        svelte_render_item.result = svelte_render_item.component.render(props);
        return svelte_render_item;
    },
};

