import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { exists, read, to_extension } from './file.js';
import { filled_array, filled_string, is_null, is_number } from './validate.js';
import sass from 'sass';
import { Logger } from './logger.js';
import { get_error_message } from './error.js';

const __dirname = dirname(resolve(join(fileURLToPath(import.meta.url), '..')));

export function replace_import_path(content) {
    if (!filled_string(content)) {
        return '';
    }
    return content.replace(/(import .*? from ')@lib/g, '$1' + __dirname);
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
    result.tags = extracted.tags.map((code) =>
        code.replace(new RegExp(`^<${tag}[^>]*>`), '').replace(new RegExp(`<\\/${tag}>$`), '')
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
                    try {
                        const compiled_sass = sass.compileString(loaded_content);
                        if (compiled_sass && compiled_sass.css) {
                            loaded_content = compiled_sass.css;
                        }
                    } catch (e) {
                        Logger.error(get_error_message(e, loaded_file, 'sass'));
                    }
                    break;
                }
            }
            result.loaded_content = loaded_content;
            return result;
        }
    }

    return result;
    /*
    const css = to_extension(path, 'css');
    if (exists(css)) {
        const css_content = read(css);
        const css_result = extract_tags_from_content(content, 'style');
        content = `${css_result.content}<style>${css_content}${css_result.tags
            .map((tag) => tag.replace(/^<style[^>]*>/, '').replace(/<\/style>$/, ''))
            .join('\n')}</style>`;
        result.css = css;
    } else {
        // load scss
        const scss = to_extension(path, 'scss');
        if (exists(scss)) {
            let scss_content = '';
            try {
                scss_content = read(scss);
                const compiled_sass = sass.compileString(scss_content);
                if(compiled_sass && compiled_sass.css) {
                    scss_content = compiled_sass.css;
                }
            } catch (e) {
                Logger.error(get_error_message(e, scss, 'sass'));
            }
            const scss_result = extract_tags_from_content(content, 'style');
            content = `${scss_result.content}<style>${scss_content}${scss_result.tags
                .map((tag) => tag.replace(/^<style[^>]*>/, '').replace(/<\/style>$/, ''))
                .join('\n')}</style>`;
            result.css = scss;
        }
    }*/
}
