import { read, write } from './file.js';
import { Logger } from './logger.js';
import { is_func, is_object } from './validate.js';

export const tab = '    ';

export function copy_template_file(src, target, replaces = {}, transform_content = undefined) {
    const content = read(src);
    if (!content) {
        Logger.error('error reading file', src);
        return;
    }
    const write_content = is_func(transform_content) ? transform_content(content) : content;

    const replace_content = replace_placeholder(write_content, replaces);
    write(target, replace_content);
    Logger.info('created file', target);
}

export function replace_placeholder(content, replaces) {
    if (!is_object(replaces)) {
        return content;
    }
    Object.entries(replaces).forEach(([key, value]) => {
        content = content.replace(new RegExp(`\\{\\{\\s*?${key}\\s*?\\}\\}`, 'g'), value || '');
    });
    return content;
}
