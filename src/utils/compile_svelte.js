import { compile } from 'svelte/compiler';
import { get_error_message } from './error.js';
import { Logger } from './logger.js';
import { in_array, filled_string, is_func, is_null, is_path, match_interface } from './validate.js';
import { exists, remove, to_extension, write } from './file.js';
import { dirname, extname, resolve } from 'path';
import { Env } from '../vars/env.js';
import { css_hash, get_file_time_hash } from './hash.js';
import { uniq_id } from './uniq.js';
import { Cwd } from '../vars/cwd.js';
import { FOLDER_GEN_CLIENT, FOLDER_GEN_SERVER, FOLDER_GEN_SRC, FOLDER_GEN_TEMP } from '../constants/folder.js';
import { search_segment } from './segment.js';
import { fix_reserved_tag_names, replace_src_in_path, replace_src_path } from './transform.js';
import { register_inject, register_i18n, register_prop } from './global.js';
import { inject } from './config.js';
import { get_language } from './i18n.js';

export async function prepare_code_to_compile(content, file, type) {
    if (!in_array(['client', 'server'], type) || !filled_string(content) || !filled_string(file)) {
        return undefined;
    }
    const folder = type_value(type, FOLDER_GEN_CLIENT, FOLDER_GEN_SERVER);
    const scope = `svelte ${type} prepare`;
    const cache_breaker = Env.is_dev() ? `?${get_file_time_hash(file)}` : '';
    // replace names of components because some can not used, which are default html tags
    if (type === 'server') {
        content = fix_reserved_tag_names(content);
    }
    const replacer = (_, imported, path) => {
        if (is_path(path)) {
            // correct the path
            path = replace_src_in_path(path, folder).replace(new RegExp(FOLDER_GEN_SRC, 'g'), folder);
            // transform to js from svelte
            const ext = extname(path);
            if (type === 'server' && ext == '.svelte') {
                path = to_extension(path, 'js');
            }
            // force file ending when nothing is specified
            if (!ext) {
                const check_ext = ['.js', '.mjs', '.ts'];
                const dir = dirname(file);
                const new_ext = check_ext.find((search_ext) => exists(resolve(dir, `${path}${search_ext}`)));
                if (!new_ext) {
                    Logger.warning(
                        get_error_message(
                            new Error(
                                `can't find import ${path} with the extensions ${check_ext.join(',')} in ${file}`
                            ),
                            file,
                            scope
                        )
                    );
                }
                path = `${path}${new_ext || ''}`;
            }
            path += cache_breaker;
        }

        return `import ${imported} from '${path}'`;
    };
    let modified_content = content.replace(/import (.*?) from ['"]([^'"]+)['"]/g, replacer);
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
    let result;
    const scope = `svelte ${type} compile`;
    const options = {
        dev: Env.is_dev(),
        generate: type_value(type, 'dom', 'ssr'),
        format: 'esm',
        immutable: true,
        hydratable: true,
        cssHash: css_hash,
    };
    if (include_css) {
        options.css = true;
    }
    try {
        // compile svelte
        const compiled = await compile(content, options);
        result = compiled;
    } catch (e) {
        Logger.error(get_error_message(e, file, scope), e.stack);
    }
    return result;
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
    return await compile_svelte_from_code(prepared_content, file, 'server');
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
// static async render(svelte_render_item, props) {
//     const propNames = Object.keys(props);
//     if (Array.isArray(propNames) && Array.isArray(svelte_render_item.compiled.vars)) {
//         // check for not used props
//         const unused_props = propNames.filter((prop) => {
//             return (
//                 svelte_render_item.compiled.vars.find((v) => {
//                     return v.name == prop;
//                 }) == null
//             );
//         });
//         if (unused_props.length > 0) {
//             svelte_render_item.notes.push({ msg: 'unused props', details: unused_props });
//         }
//     }

//     // set the correct translations for the page
//     I18N.setup();
//     const translations = I18N.get(props._wyvr.language);
//     I18N.i18n.init(translations);
//     try {
//         svelte_render_item.result = await svelte_render_item.component.render(props);
//     } catch (e) {
//         return [e, null];
//     }
//     // write css file
//     const css_file_path = join('gen', 'css', `${props._wyvr.identifier.replace(/\./g, '-')}.css`);
//     const identifier_item = {
//         url: props.url,
//         identifier: props._wyvr.identifier,
//         extension: props._wyvr.extension,
//     };
//     let media_files = {};
//     if (!fs.existsSync(css_file_path)) {
//         media_files = await this.write_css_file(css_file_path, svelte_render_item.result.css.code);
//     } else {
//         const last_modified = fs.statSync(css_file_path).mtime;
//         // changes in the time range of 5 seconds avoids recreation of css files
//         // @WARN when hugh amounts of data gets generated css files can be written multiple times
//         if (new Date().getTime() - new Date(last_modified).getTime() > 5000) {
//             media_files = await this.write_css_file(css_file_path, svelte_render_item.result.css.code);
//         }
//     }
//     // when there are media files returned, create them
//     await this.write_media_files(css_file_path, media_files);
//     if (Object.keys(media_files).length > 0) {
//         // inject media css files
//         svelte_render_item.result.html = await this.inject_media_files(
//             svelte_render_item.result.html,
//             css_file_path,
//             media_files
//         );
//     }
//     // inject translations
//     if (translations) {
//         svelte_render_item.result.html = svelte_render_item.result.html.replace(
//             /<\/body>/,
//             `<script>var wyvr_i18n_tr = ${JSON.stringify(translations)}</script></body>`
//         );
//     }

//     // svelte_render_item.result.html = svelte_render_item.result.html.replace('</head>', `<style>${svelte_render_item.result.css.code}</style></head>`);
//     return [null, svelte_render_item, identifier_item];
// }
