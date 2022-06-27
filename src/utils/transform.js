import { extname, join } from 'path';
import { exists, read, to_extension } from './file.js';
import { filled_array, filled_object, filled_string, is_null, is_number, is_string } from './validate.js';
import { compile_sass, compile_typescript } from './compile.js';
import { Cwd } from '../vars/cwd.js';
import { to_dirname } from './to.js';
import { clone } from './json.js';
import { WyvrFileLoading } from '../struc/wyvr_file.js';
import { uniq_values } from './uniq.js';
import { Env } from '../vars/env.js';

const __dirname = join(to_dirname(import.meta.url), '..');

export function replace_import_path(content) {
    if (!filled_string(content)) {
        return '';
    }
    return content.replace(/(import .*? from ')@lib/g, '$1' + __dirname);
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
    return path.replace(/^@src\//g, replace);
}

export async function combine_splits(path, content) {
    const result = {
        path: is_null(path) ? '' : path,
        content: '',
        css: undefined,
        js: undefined,
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
    if (filled_string(style_extract.loaded_content)) {
        content = `${style_extract.content}<style>${style_extract.loaded_content}${style_extract.tags.join(
            '\n'
        )}</style>`;
        result.css = style_extract.loaded_file;
    }

    // load scripts
    const script_extract = await extract_and_load_split(path, content, 'script', ['js', 'mjs', 'cjs']);
    if (filled_string(script_extract.loaded_content)) {
        content = `<script>${script_extract.tags.join('\n')}${script_extract.loaded_content}</script>${
            script_extract.content
        }`;
        result.js = script_extract.loaded_file;
    }

    // set content
    result.content = content;
    return result;
}

export function extract_tags_from_content(content, tag, max) {
    const result = {
        content,
        tags: [],
    };
    if (!filled_string(content) || !filled_string(tag)) {
        return result;
    }
    tag = tag.toLowerCase().trim();
    const use_max = is_number(max) && max > 0;

    let search_tag = true;
    const tag_start = `<${tag}`;
    const tag_end = `</${tag}>`;
    let tag_start_index, tag_end_index;
    while (search_tag) {
        tag_start_index = content.indexOf(tag_start);
        tag_end_index = content.indexOf(tag_end);
        if (tag_start_index > -1 && tag_end_index > -1) {
            // append the tag into the result
            result.tags.push(content.slice(tag_start_index, tag_end_index + tag_end.length));
            // remove the script from the content
            content = content.substr(0, tag_start_index) + content.substr(tag_end_index + tag_end.length);
            // allow that not all tags should be extracted
            if (use_max && result.tags.length == max) {
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
        loaded_content: undefined,
    };
    if (filled_string(content)) {
        const ext = path ? extname(path) : undefined;
        content = replace_src_path(content, 'gen/src', ext);
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
                const contains_sass =
                    (code.indexOf('type="text/scss"') > -1 ||
                        code.indexOf('lang="scss"') > -1 ||
                        code.indexOf('lang="sass"') > -1) &&
                    tag == 'style';
                const contains_typescript = code.indexOf('lang="ts"') > -1 && tag == 'script';
                code = code.replace(new RegExp(`^<${tag}[^>]*>`), '').replace(new RegExp(`<\\/${tag}>$`), '');
                if (contains_sass) {
                    code = await compile_sass(code, path);
                }
                if (contains_typescript) {
                    code = await compile_typescript(code, path);
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
    // replace isServer and isClient and the imports
    return content
        .replace(/([^\w])isServer([^\w])/g, `$1${is_server}$2`)
        .replace(/([^\w])isClient([^\w])/g, `$1${is_client}$2`)
        .replace(/import \{[^}]*?\} from ["']@wyvr\/generator["'];?/g, '')
        .replace(/(?:const|let)[^=]*?= require\(["']@wyvr\/generator["']\);?/g, '');
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
    Object.keys(default_values).forEach((key) => {
        if (is_null(new_data[key])) {
            new_data[key] = default_values[key];
        }
    });
    return new_data;
}
export function insert_hydrate_tag(content, wyvr_file) {
    if (!filled_string(content) || !wyvr_file) {
        return '';
    }
    // extract scripts
    const scripts = extract_tags_from_content(content, 'script');
    content = scripts.content;
    const styles = extract_tags_from_content(content, 'style');
    content = styles.content;

    // create props which gets hydrated
    const props = extract_props(scripts.tags);
    const props_include = `data-props="${props.map((prop) => `{_wyvrGenerateProp('${prop}', ${prop})}`).join(',')}"`;

    // add portal when set
    const portal = wyvr_file.config.portal ? `data-portal="${wyvr_file.config.portal}"` : '';
    // add media when loading is media
    const media = wyvr_file.config.loading == WyvrFileLoading.media ? `data-media="${wyvr_file.config.media}"` : '';
    // add hydrate tag
    const hydrate_tag = wyvr_file.config.display == 'inline' ? 'span' : 'div';
    // debug info
    const debug_info = Env.is_dev() ? `data-hydrate-path="${wyvr_file.rel_path}"` : '';
    content = `<${hydrate_tag} data-hydrate="${wyvr_file.name}" ${debug_info} ${props_include} ${portal} ${media}>${content}</${hydrate_tag}>`;
    content = replace_slots_static(content);
    return scripts.tags.join('\n') + content + styles.tags.join('\n');
}
export function extract_props(scripts) {
    const props = [];
    if (!is_string(scripts)) {
        scripts = [scripts];
    }
    scripts.forEach((script) => {
        if (!filled_string(script)) {
            return;
        }
        //export let price = null;
        //export let price;
        //export let price
        script.replace(/export let ([^ =;\n]*)/g, (_, prop) => {
            props.push(prop);
            return '';
        });
    });
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
    if (start_index == -1) {
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
                if (open_brackets == 0) {
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