import { dirname, extname, join, resolve } from 'path';
import { exists, read, to_extension } from './file.js';
import { filled_array, filled_object, filled_string, is_array, is_func, is_null, is_number, is_path, is_string } from './validate.js';
import { compile_sass, compile_typescript, insert_import } from './compile.js';
import { Cwd } from '../vars/cwd.js';
import { to_dirname } from './to.js';
import { clone } from './json.js';
import { WyvrFileLoading } from '../struc/wyvr_file.js';
import { uniq_values } from './uniq.js';
import { Env } from '../vars/env.js';
import { Logger } from './logger.js';
import { FOLDER_GEN_CLIENT, FOLDER_GEN_SERVER, FOLDER_GEN_SRC } from '../constants/folder.js';
import { get_error_message } from './error.js';
import { append_cache_breaker } from './cache_breaker.js';
import { Config } from './config.js';

const __dirname = join(to_dirname(import.meta.url), '..');

export function replace_import_path(content) {
    if (!filled_string(content)) {
        return '';
    }
    return content.replace(/(import .*? from ')@lib/g, `$1${__dirname}`);
}
/**
 * Replace the @src imports with the given to path
 * @param content source code with @src imports
 * @param to path to the src folder, relative to the cwd
 * @param extension the extension of the content, svelte files has to be handelt different
 * @returns the source code with the replaced @src imports
 */
export function replace_src_path(content, to, extension) {
    if (!filled_string(content)) {
        return undefined;
    }
    if (!filled_string(to)) {
        return content;
    }
    const search = /(['"])@src\//g;
    const replace = `$1${Cwd.get()}/${to.replace('^/', '').replace(/\/$/, '')}/`;
    // everything except svelte files
    if (!is_string(extension) || is_null(extension.match(/svelte$/))) {
        return content.replace(search, replace);
    }
    const extracted_script = extract_tags_from_content(content, 'script', 1);
    extracted_script.tags = extracted_script.tags.map((script) => script.replace(search, replace));
    content = extracted_script.tags.join('') + extracted_script.content;

    const extracted_style = extract_tags_from_content(content, 'style', 1);
    extracted_style.tags = extracted_style.tags.map((script) => script.replace(search, replace));
    content = extracted_style.content + extracted_style.tags.join('');

    return content;
}
/**
 * Replace the @src imports with the given to path
 * @param content source code with @src imports
 * @param to path to the src folder, relative to the cwd
 * @returns the path with the replaced @src
 */
export function replace_src_in_path(path, to) {
    if (!filled_string(path)) {
        return '';
    }
    if (!filled_string(to)) {
        return path;
    }
    const replace = `${Cwd.get()}/${to.replace('^/', '').replace(/\/$/, '')}/`;
    return replace_src(path, replace);
}

export function replace_src(path, replace) {
    if (!filled_string(path)) {
        return '';
    }
    if (!is_string(replace)) {
        return path;
    }
    if (path.indexOf('@src') !== 0) {
        return path;
    }
    return path.replace(/^@src\//, replace);
}

export async function combine_splits(path, content) {
    const result = {
        path: is_null(path) ? '' : path,
        content: '',
        css: undefined,
        js: undefined
    };
    if (!filled_string(content)) {
        content = '';
    }
    if (!filled_string(path)) {
        result.content = content;
        return result;
    }
    // load styles
    const style_extract = await extract_and_load_split(path, content, 'style', ['css', 'scss']);
    const style_content = (style_extract.loaded_content || '') + style_extract.tags.join('\n');
    if (filled_string(style_content)) {
        content = `${style_extract.content}<style>${style_content}</style>`;
    }
    if (filled_string(style_extract.loaded_content)) {
        result.css = style_extract.loaded_file;
    }

    // load scripts
    const script_extract = await extract_and_load_split(path, content, 'script', ['js', 'mjs', 'cjs']);
    if (filled_string(script_extract.loaded_content)) {
        content = `<script>${script_extract.tags.join('\n')}${script_extract.loaded_content}</script>${script_extract.content}`;
        result.js = script_extract.loaded_file;
    }

    // set content
    // replaced src has to be reverted otherwise the next steps will not work when building the tree
    result.content = content.replace(new RegExp(Cwd.get(FOLDER_GEN_SRC), 'g'), '@src');
    return result;
}

export function extract_tags_from_content(content, raw_tag, max) {
    const result = {
        content,
        tags: []
    };
    if (!filled_string(content) || !filled_string(raw_tag)) {
        return result;
    }
    const tag = raw_tag.toLowerCase().trim();
    const use_max = is_number(max) && max > 0;

    let search_tag = true;
    const tag_start = `<${tag}`;
    const tag_end = `</${tag}>`;
    let tag_start_index;
    let tag_end_index;
    while (search_tag) {
        tag_start_index = content.indexOf(tag_start);
        tag_end_index = content.indexOf(tag_end);
        if (tag_start_index > -1 && tag_end_index > -1) {
            // append the tag into the result
            result.tags.push(content.slice(tag_start_index, tag_end_index + tag_end.length));
            // remove the script from the content
            content = content.substr(0, tag_start_index) + content.substr(tag_end_index + tag_end.length);
            // allow that not all tags should be extracted
            if (use_max && result.tags.length === max) {
                search_tag = false;
            }
            continue;
        }
        search_tag = false;
    }
    result.content = content;

    return result;
}

export async function extract_and_load_split(path, content, tag, extensions) {
    const result = {
        content: '',
        path,
        tag,
        tags: [],
        loaded_file: undefined,
        loaded_content: undefined
    };
    if (filled_string(content)) {
        const ext = path ? extname(path) : undefined;
        content = replace_src_path(content, FOLDER_GEN_SRC, ext);
        result.content = content;
    }
    if (!filled_string(tag)) {
        return result;
    }
    const extracted = extract_tags_from_content(content, tag);
    result.content = extracted.content;
    result.tags = (
        await Promise.all(
            extracted.tags.map(async (code) => {
                const is_style = tag == 'style';
                const contains_sass = (code.indexOf('type="text/scss"') > -1 || code.indexOf('lang="scss"') > -1 || code.indexOf('lang="sass"') > -1) && is_style;
                const contains_typescript = code.indexOf('lang="ts"') > -1 && tag == 'script';
                code = code.replace(new RegExp(`^<${tag}[^>]*>`), '').replace(new RegExp(`<\\/${tag}>$`), '');
                if (contains_sass) {
                    return await compile_sass(code, path);
                }
                if (contains_typescript) {
                    return await compile_typescript(code, path);
                }
                if (is_style) {
                    return insert_import(code, path);
                }
                return code;
            })
        )
    ).filter((x) => x);

    if (!filled_array(extensions)) {
        return result;
    }

    for (const ext of extensions) {
        const loaded_file = to_extension(path, ext);
        if (exists(loaded_file)) {
            result.loaded_file = loaded_file;
            let loaded_content = read(loaded_file);
            switch (ext) {
                case 'scss': {
                    loaded_content = await compile_sass(loaded_content, loaded_file);
                    break;
                }
                case 'ts': {
                    loaded_content = await compile_typescript(loaded_content, loaded_file);
                    break;
                }
            }
            result.loaded_content = loaded_content;
            return result;
        }
    }

    return result;
}

export function replace_wyvr_magic(content, as_client) {
    if (!filled_string(content)) {
        return '';
    }
    // modify __ => translation
    if (as_client) {
        content = content.replace(/(\W)__\(/g, '$1window.__(');
    }
    const is_server = as_client ? 'false' : 'true';
    const is_client = as_client ? 'true' : 'false';
    const target_dir = as_client ? FOLDER_GEN_CLIENT : FOLDER_GEN_SERVER;
    // use server implementation on the server
    if (!as_client) {
        content = content.replace(/(['"])@wyvr\/generator\/universal\.js(['"])/g, '$1@wyvr/generator/universal_server.js$2');
    }
    // replace isServer and isClient and the imports
    return content
        .replace(/([^\w])isServer([^\w])/g, `$1${is_server}$2`)
        .replace(/([^\w])isClient([^\w])/g, `$1${is_client}$2`)
        .replace(/import \{[^}]*?\} from ["']@wyvr\/generator["'];?/g, '')
        .replace(/(?:const|let)[^=]*?= require\(["']@wyvr\/generator["']\);?/g, '')
        .replace(/from (['"])([^'"]+)['"]/g, (_, quote, path) => {
            if (path.indexOf(FOLDER_GEN_SRC) === -1) {
                return _;
            }

            return `from ${quote}${path.replace(FOLDER_GEN_SRC, target_dir)}${quote}`;
        })
        .replace(/(\W)injectConfig\(['"]([^'"]+)['"](?:\s?,\s([^)]+)?)?\)/g, (_, pre, path, fallback) => {
            const value = Config.get(path);
            if (is_null(value)) {
                return pre + fallback;
            }
            return pre + JSON.stringify(value);
        });
}
export function set_default_values(data, default_values) {
    if (!filled_object(data) && !filled_object(default_values)) {
        return undefined;
    }
    if (!filled_object(data)) {
        return default_values;
    }
    const new_data = clone(data);
    if (!filled_object(default_values)) {
        return new_data;
    }
    for (const key of Object.keys(default_values)) {
        if (is_null(new_data[key])) {
            new_data[key] = default_values[key];
        }
    }
    return new_data;
}
export function insert_hydrate_tag(content, wyvr_file) {
    if (!filled_string(content)) {
        return '';
    }
    if (!wyvr_file) {
        return content;
    }
    // extract scripts
    const scripts = extract_tags_from_content(content, 'script');
    content = scripts.content;
    const styles = extract_tags_from_content(content, 'style');
    content = styles.content;

    // create props which gets hydrated
    const props = extract_props(scripts.tags);
    Logger.debug('props', wyvr_file.path, props);
    const props_include = `data-props="${props.map((prop) => `{_prop('${prop}', ${prop})}`).join(',')}"`;

    // add portal when set
    const portal = wyvr_file.config.portal ? `data-portal="${wyvr_file.config.portal}"` : undefined;
    // add media when loading is media
    const media = wyvr_file.config.loading === WyvrFileLoading.media ? `data-media="${wyvr_file.config.media}"` : undefined;
    // add the loading type as attribute when using this info in the FE
    const loading = `data-loading="${wyvr_file.config.loading}"`;
    // add hydrate tag
    const hydrate_tag = wyvr_file.config.display === 'inline' ? 'span' : 'div';
    // debug info
    const debug_info = Env.is_dev() ? `data-hydrate-path="${wyvr_file.rel_path}"` : undefined;
    const attributes = [debug_info, props_include, loading, portal, media].filter((x) => x).join(' ');
    content = `<${hydrate_tag} data-hydrate="${wyvr_file.name}" ${attributes}>${content}</${hydrate_tag}>`;
    content = replace_slots_static(content);
    return scripts.tags.join('\n') + content + styles.tags.join('\n');
}
export function extract_props(scripts) {
    const props = [];
    if (is_string(scripts)) {
        scripts = [scripts];
    }
    if (!is_array(scripts)) {
        return [];
    }
    for (const script of scripts) {
        if (!filled_string(script)) {
            continue;
        }
        //export let price = null;
        //export let price;
        //export let price
        script.replace(/export let ([^ =;\n]*)/g, (_, prop) => {
            props.push(prop);
            return '';
        });
    }
    return uniq_values(props);
}
export function replace_slots(content, fn) {
    if (!filled_string(content)) {
        return '';
    }
    const content_replaced = content.replace(/(<slot[^>/]*>.*?<\/slot>|<slot[^>]*\/>)/g, (_, slot) => {
        const match = slot.match(/name="(.*)"/);
        let name = null;
        if (match) {
            name = match[1];
        }
        return fn(name || 'default', slot);
    });
    return content_replaced;
}
export function replace_slots_static(content) {
    return replace_slots(content, (name, slot) => `<span data-slot="${name}">${slot}</span>`);
}
export function remove_on_server(content) {
    if (!filled_string(content)) {
        return '';
    }
    const search_string = 'onServer(';
    const start_index = content.indexOf(search_string);
    if (start_index === -1) {
        return content;
    }
    let index = start_index + search_string.length;
    let open_brackets = 1;
    let found_closing = false;
    const length = content.length;
    while (index < length && open_brackets > 0) {
        const char = content[index];
        switch (char) {
            case '(':
                open_brackets++;
                break;
            case ')':
                open_brackets--;
                if (open_brackets === 0) {
                    found_closing = true;
                }
                break;
        }
        index++;
    }
    if (found_closing) {
        const replaced = content.substr(0, start_index) + content.substr(index);
        // check if more onServer handlers are used
        return remove_on_server(replaced);
    }
    return content;
}

export function fix_reserved_tag_names(content) {
    // replace:
    // import Nav from
    // <Nav/>
    // <Nav />
    // <Nav a="nav"></Nav>

    // avoid replacing
    // const nav
    return content.replace(/(<|<\/|import\s)(Nav)(\s|\/|>)/g, '$1Wyvr$2$3');
}

export function replace_imports(content, file, src_folder, scope, hooks) {
    if (!filled_string(content)) {
        return '';
    }

    const replacer = (_, imported, path) => {
        if (is_path(path)) {
            // correct the path
            path = replace_src_in_path(path, src_folder).replace(new RegExp(FOLDER_GEN_SRC, 'g'), src_folder);
            // transform to js from svelte
            const ext = extname(path);
            if (is_func(hooks?.modify_path)) {
                path = hooks.modify_path(path, ext);
            }
            // transform to js from ts
            if (ext === '.ts') {
                path = to_extension(path, 'js');
            }

            // force file ending when nothing is specified
            if (!ext) {
                const check_ext = ['.js', '.mjs', '.ts'];
                const dir = dirname(file);
                const new_ext = check_ext.find((search_ext) => exists(resolve(dir, `${path}${search_ext}`)));
                if (!new_ext) {
                    Logger.warning(get_error_message(new Error(`can't find import ${path} with the extensions ${check_ext.join(',')} in ${file}`), file, scope));
                }
                path = `${path}${new_ext || ''}`;
            }
            path = append_cache_breaker(path);
        }

        return `import ${imported} from '${path}'`;
    };
    return content.replace(/import ([\w\W]+?) from ['"]([^'"]+)['"]/g, replacer);
}
