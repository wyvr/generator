import { filled_string, in_array, is_null, is_object } from '../utils/validate.js';
/**
 * @typedef {Object} CollectionEntry
 *
 * @property {string} [name] the name
 * @property {number} [order=0] the order
 * @property {string} scope the scope in which the collection entry will be placed
 * @property {boolean} [visible=true] visibility status
 * @property {string} url the URL
 * @property {Object} [mtime] modification time of the source file
 * @property {Date} [mtime.mtime=new Date()] the actual modification time
 * @property {string} [mtime.src=''] the source from which the modification time was obtained
 */

/**
 * Create new CollectionEntry
 * @param {Object} [data={}] data from which the entry should be created
 * @param {Object} [default_values={}] optional values which should be used when the data object does not contain them
 * @returns {CollectionEntry}
 */
export function collection_entry(data = {}, default_values = {}) {
    const result = {
        name: undefined,
        order: 0,
        scope: 'none',
        visible: true,
        url: '',
        mtime: undefined,
    };
    Object.keys(result).forEach((key) => {
        if (is_object(data) && !is_null(data[key])) {
            if (in_array(['name', 'url', 'scope'], key) && !filled_string(data[key])) {
                return;
            }
            result[key] = data[key];
            return;
        }
        if (is_object(data) && !is_null(default_values[key])) {
            if (in_array(['name', 'url', 'scope'], key) && !filled_string(default_values[key])) {
                return;
            }
            result[key] = default_values[key];
        }
    });
    return result;
}

/**
 * @typedef {Object.<string, CollectionEntry[]>} Collections
 */
