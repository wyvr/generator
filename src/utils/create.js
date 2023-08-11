import { read, write } from './file.js';
import { Logger } from './logger.js';
import { is_func, is_object } from './validate.js';

export const tab = '    ';

/**
 * Copy file and replace the placeholders in the content
 * @param {string} src
 * @param {string} target
 * @param {Object} [replaces={}]
 * @param {Function} [transform_content=undefined] Function to transform the content before replacing the placeholders
 * @returns
 */
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

/**
 * Replace placeholder in the given content
 * The placeholders has the following format:
 * {{key}} where key is the key of the property of the object replaces
 * @param {string} content
 * @param {Object} replaces
 * @returns {string}
 */
export function replace_placeholder(content, replaces) {
    if (!is_object(replaces)) {
        return content;
    }
    Object.entries(replaces).forEach(([key, value]) => {
        content = content.replace(new RegExp(`\\{\\{\\s*?${key}\\s*?\\}\\}`, 'g'), value || '');
    });
    return content;
}
