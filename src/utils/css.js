import { join, sep } from 'path';
import { FOLDER_CSS } from '../constants/folder.js';
import { Env } from '../vars/env.js';
import { exists, write } from './file.js';
import { to_relative_path } from './to.js';

export function split_css_into_media_query_files(content, file) {
    if (Env.is_prod()) {
        const media_files = {};
        const media_query_files = {};
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
                    write(path, `/*for "${key}"*/\n` + media_files[key]);
                }
                media_query_files[key] = sep + join(FOLDER_CSS, to_relative_path(path));
            });

        return media_query_files;
    }
    return undefined;
}
