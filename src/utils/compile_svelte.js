import { compile } from 'svelte/compiler';
import { get_error_message } from './error.js';
import { Logger } from './logger.js';
import { in_array, filled_string, is_func, is_null, match_interface } from './validate.js';
import { remove, to_extension, write } from './file.js';
import { extname, join } from 'path';
import { Env } from '../vars/env.js';
import { css_hash } from './hash.js';
import { uniq_id } from './uniq.js';
import { Cwd } from '../vars/cwd.js';
import { FOLDER_GEN, FOLDER_GEN_CLIENT, FOLDER_GEN_SERVER, FOLDER_GEN_TEMP } from '../constants/folder.js';
import { search_segment } from './segment.js';
import { fix_reserved_tag_names, replace_imports, replace_src_path } from './transform.js';
import { register_inject, register_i18n, register_prop } from './global.js';
import { inject } from './config.js';
import { get_language } from './i18n.js';
import { get_cache_breaker } from './cache_breaker.mjs';

export async function prepare_code_to_compile(content, file, type) {
    if (!in_array(['client', 'server'], type) || !filled_string(content) || !filled_string(file)) {
        return undefined;
    }
    const folder = type_value(type, FOLDER_GEN_CLIENT, FOLDER_GEN_SERVER);
    const scope = `svelte ${type} prepare`;
    // replace names of components because some can not used, which are default html tags
    if (type === 'server') {
        content = fix_reserved_tag_names(content);
    }
    // replace the imports in this file
    let modified_content = replace_imports(content, file, folder, scope, get_cache_breaker(Env.is_dev()), {
        modify_path: (path, ext) => {
            if (type === 'server' && ext == '.svelte') {
                return to_extension(path, 'js');
            }
            return path;
        },
    });
    // replace names of components because some can not used, which are default html tags
    if (type === 'server') {
        modified_content = fix_reserved_tag_names(modified_content);
    }

    return await inject(replace_src_path(modified_content, folder, extname(file)), file);
}

export async function compile_svelte_from_code(content, file, type, include_css = false) {
    if (!in_array(['client', 'server'], type) || !filled_string(content) || !filled_string(file)) {
        return undefined;
    }
    const scope = `svelte ${type} compile`;
    const options = {
        dev: Env.is_dev(),
        generate: type_value(type, 'dom', 'ssr'),
        format: 'esm',
        immutable: true,
        hydratable: true,
        cssHash: css_hash,
        css: 'external',
    };
    if (include_css) {
        options.css = 'injected';
    }
    try {
        // console.log(content)
        // compile svelte
        const compiled = await compile(content, options);
        if (type === 'server') {
            compiled.js.code = make_svelte_code_async(compiled.js.code);
            write(join(FOLDER_GEN, 'compile', to_extension(file, '.mjs')), compiled.js.code);
        }
        return compiled;
    } catch (e) {
        Logger.error(get_error_message(e, file, scope), e.stack);
    }
    return undefined;
}
export function type_value(type, client, server) {
    if (type === 'client') {
        return client;
    }
    if (type === 'server') {
        return server;
    }
    return undefined;
}

export async function compile_server_svelte_from_code(content, file) {
    const prepared_content = await prepare_code_to_compile(content, file, 'server');

    const result = await compile_svelte_from_code(prepared_content, file, 'server');
    return result;
}
export async function compile_client_svelte_from_code(content, file) {
    return await prepare_code_to_compile(content, file, 'client');
}

export async function execute_server_compiled_svelte(compiled, file) {
    if (!search_segment(compiled, 'js.code')) {
        Logger.warning("can't execute", file, 'no code found');
        return undefined;
    }

    if (!filled_string(file)) {
        Logger.warning("can't execute code without file");
        return undefined;
    }
    let component;
    const tmp_file = Cwd.get(FOLDER_GEN_TEMP, `${uniq_id()}.js`);
    write(tmp_file, compiled.js.code);
    try {
        component = await import(tmp_file);
        // return default when available
        if (!is_null(component.default)) {
            component = component.default;
        }
    } catch (e) {
        component = undefined;
        Logger.error(get_error_message(e, file, 'svelte server execute'));
    }
    remove(tmp_file);
    return component;
}

export async function render_server_compiled_svelte(exec_result, data, file) {
    if (
        !match_interface(exec_result, { compiled: true, component: true, result: true }) ||
        !filled_string(file) ||
        is_null(data)
    ) {
        return undefined;
    }
    // set properties
    // const propNames = Object.keys(data);
    // if (Array.isArray(propNames) && Array.isArray(exec_result.compiled.vars)) {
    //     // check for not used props
    //     const unused_props = propNames.filter((prop) => {
    //         return (
    //             exec_result.compiled.vars.find((v) => {
    //                 return v.name == prop;
    //             }) == null
    //         );
    //     });
    //     if (unused_props.length > 0) {
    //         exec_result.notes.push({ msg: 'unused props', details: unused_props });
    //     }
    // }

    register_inject(file);
    // transform props to allow loading them from external file
    register_prop(file);
    // set the correct translations for the page
    register_i18n(get_language(data?._wyvr?.language), file);

    // add registering onServer
    global.onServer = async (callback) => {
        if (!is_func(callback)) {
            return undefined;
        }
        return await callback();
    };

    try {
        exec_result.result = await exec_result.component.render(data);
        // remove svelte comments
        exec_result.result.html = exec_result.result.html.replace(/<!-- HTML_TAG_(?:START|END) -->/g, '');
    } catch (e) {
        Logger.error(get_error_message(e, file, 'svelte server render'));
        return undefined;
    }

    return exec_result;
}
export function make_svelte_code_async(code) {
    if (!filled_string(code)) {
        return '';
    }
    code = code
        // make main function async
        .replace(/(create_ssr_component\()/, 'await $1async ')
        // wrap main function in try catch
        .replace(/(create_ssr_component.*=> {)/, '$1 try {')
        .replace(/(\}\);[\n\s]+export default )/, "} catch(e) {console.log(import.meta.url, e); return '';}\n$1")
        // make onServer async
        .replace(/(onServer\()/g, 'await $1')
        // use own svelte internal, which is async
        .replace(/['"]svelte\/internal['"]/, `'${Cwd.get(FOLDER_GEN_SERVER, 'svelte_internal.mjs')}'`);
    const template_index = code.indexOf('await create_ssr_component');
    if (template_index == -1) {
        return code;
    }

    const template = code
        .substring(template_index)
        // make slots async
        .replace(/(slots\.\w+? \? )(slots\.\w+?\()/g, '$1await $2')
        // remove event dispatcher because they are not working server side
        .replace(/([\s=])createEventDispatcher\([^)]*?\)/g, '$1() => {}')
        // make sub components async
        .replace(/(\$\{)(validate_component\()/g, '$1await $2')
        // make default async
        //.replace(/default: \(\) => \{/g, 'default: async () => {')
        // make #each async
        .replace(/\$\{each\(([^,]+), \(([^)]+)\) +=> \{/g, '${await each($1, async ($2) => {')
        .replace(/\$\{each\(([^,]+), ([^=]+)=> \{/g, '${await each($1, async $2=> {')
        // make arrow functions async
        //.replace(/((?:\(\)|[^()]+?) => \{)/g, 'async $1')
        .replace(/: (\([^)]*?\) => \{)/g, ': async $1');

    return code.substring(0, template_index) + template;
}
