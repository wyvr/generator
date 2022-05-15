import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { exists, read, to_extension } from './file.js';
import { filled_string, is_null, is_number } from './validate.js';

const __dirname = dirname(resolve(join(fileURLToPath(import.meta.url), '..')));

export function replace_import_path(content) {
    if (!filled_string(content)) {
        return '';
    }
    return content.replace(/(import .*? from ')@lib/g, '$1' + __dirname);
}

export function combine_splits(path, content) {
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
    // load css
    const css = to_extension(path, 'css');
    if (exists(css)) {
        const css_content = read(css);
        const css_result = extract_tags_from_content(content, 'style');
        content = `${css_result.content}<style>${css_content}${css_result.tags
            .map((tag) => tag.replace(/^<style[^>]*>/, '').replace(/<\/style>$/, ''))
            .join('\n')}</style>`;
        result.css = css;
    }

    // load js
    const js = to_extension(path, 'js');
    if (exists(js)) {
        const js_content = read(js);
        const js_result = extract_tags_from_content(content, 'script');
        content = `<script>${js_result.tags
            .map((tag) => tag.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, ''))
            .join('\n')}${js_content}</script>${js_result.content}`;
        result.js = js;
    }

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
