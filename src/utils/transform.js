import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { exists, read, to_extension } from './file.js';
import { filled_array, filled_string, is_null, is_number, is_string } from './validate.js';
import { compile_sass, compile_typescript } from './compile.js';
import { Cwd } from '../vars/cwd.js';

const __dirname = dirname(resolve(join(fileURLToPath(import.meta.url), '..')));

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
 * @returns the source code ith the replaced @src imports
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
        result.content = content;
    }
    if (!filled_string(tag)) {
        return result;
    }
    const extracted = extract_tags_from_content(content, tag);
    result.content = extracted.content;
    result.tags = await Promise.all(
        extracted.tags.map(async (code) => {
            const contains_sass =
                (code.indexOf('type="text/scss"') > -1 || code.indexOf('lang="sass"') > -1) && tag == 'style';
            const contains_typescript =
                (code.indexOf('lang="ts"') > -1) && tag == 'script';
            code = code.replace(new RegExp(`^<${tag}[^>]*>`), '').replace(new RegExp(`<\\/${tag}>$`), '');
            if (contains_sass) {
                code = await compile_sass(code, path);
            }
            if (contains_typescript) {
                code = await compile_typescript(code, path);
            }
            return code;
        })
    );

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

export async function preprocess_content(content) {
    /*
    if (!content || typeof content != 'string') {
        return [null, ''];
    }
    const style_result = Transform.extract_tags_from_content(content, 'style');
    if (
        style_result &&
        style_result.result &&
        style_result.result.some((entry) => entry.indexOf('type="text/scss"') > -1 || entry.indexOf('lang="sass"') > -1)
    ) {
        let sass_result = null;
        try {
            sass_result = sass.renderSync({
                data: style_result.result
                    .map((entry) => {
                        const raw = entry.replace(/<style[^>]*>/g, '').replace(/<\/style>/g, '');
                        return this.src_import_path(raw, 'gen/raw', '.css');
                    })
                    .join('\n'),
            });
        } catch (e) {
            return [Error.get(e, e.file, 'sass'), content];
        }
        if (sass_result) {
            return [null, `${style_result.content}<style>${sass_result.css.toString()}</style>`];
        }
    }

    return [null, content];
    */
}
