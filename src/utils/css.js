import { join, sep } from 'path';
import { FOLDER_CSS } from '../constants/folder.js';
import { Env } from '../vars/env.js';
import { exists, write } from './file.js';
import { to_relative_path } from './to.js';
import { filled_string, is_null, is_object } from './validate.js';

export function write_css_file(file, code, media_query_files) {
    if (!filled_string(file) || !filled_string(code) || is_null(media_query_files) || !is_object(media_query_files)) {
        return {};
    }
    write(file, code);
    // file must exists before it can be splitted
    const splitted_media_queries = split_css_into_media_query_files(code, file);
    if (splitted_media_queries) {
        media_query_files[get_css_path(file)] = splitted_media_queries;
    }
    return media_query_files;
}
export function get_css_path(file) {
    if (!filled_string(file)) {
        return undefined;
    }
    return sep + join(FOLDER_CSS, to_relative_path(file));
}
export function split_css_into_media_query_files(content, file) {
    if (Env.is_prod()) {
        const media_files = {};
        const media_query_files = {};
        if (!filled_string(content) || !exists(file)) {
            return media_query_files;
        }
        // extract the media queries from the css_code
        const remaining_content = content.replace(/@media([^{]*)\{((?:(?!\}\s*\}).)*\})}/g, (_, media, code) => {
            const key = media.trim();
            if (!media_files[key]) {
                media_files[key] = '';
            }
            // append to the media query to generate a single file
            media_files[key] += code;
            return '';
        });
        // write remaining content without media queries
        write(file, remaining_content);
        // write the media query files
        Object.keys(media_files)
            .sort()
            .forEach((key, index) => {
                const path = file.replace(/\.css$/, `_${index}.css`);
                if (!exists(path)) {
                    write(path, `/*for media query "${key}"*/\n` + media_files[key]);
                }
                media_query_files[key] = get_css_path(path);
            });

        return media_query_files;
    }
    return undefined;
}
