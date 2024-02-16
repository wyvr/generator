import { to_identifier_name, to_relative_path } from '../utils/to.js';
import { filled_string } from '../utils/validate.js';

/**
 *
 * @param {string} doc path to the used doc file
 * @param {string} layout path to the used layout file
 * @param {string} page path to the used page file
 * @returns {{ identifier: string, doc: string, layout: string, page:string }}
 */
export function Identifier(doc, layout, page) {
    const identifier = {
        identifier: 'default',
        doc: 'Default.js',
        layout: 'Default.js',
        page: 'Default.js'
    };
    if (filled_string(doc)) {
        identifier.doc = to_relative_path(doc).replace(/^doc\//, '');
    }
    if (filled_string(layout)) {
        identifier.layout = to_relative_path(layout).replace(/^layout\//, '');
    }
    if (filled_string(page)) {
        identifier.page = to_relative_path(page).replace(/^page\//, '');
    }
    identifier.identifier = to_identifier_name(identifier.doc, identifier.layout, identifier.page);
    return identifier;
}
