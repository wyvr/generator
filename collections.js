import {
    filled_object,
    is_array,
    is_func,
    is_null,
} from './src/utils/validate.js';
import { sort_collections } from './src/utils/collections.js';
import { collection_entry } from './src/model/collection.js';
import { KeyValue } from './src/utils/database/key_value.js';
import { STORAGE_COLLECTION } from './src/constants/storage.js';

const db = new KeyValue(STORAGE_COLLECTION);
/**
 * Get the collections
 * @returns {Promise<import('./src/model/collection.js').Collections>}
 */
export function get_collections() {
    const result = db.all();
    return result;
}

/**
 * Callback when modifying the collections
 *
 * @callback modifyCollectionCallback
 * @param {string} scope
 * @param {import('./src/model/collection.js').CollectionsEntry[]} list
 * @returns {import('./src/model/collection.js').CollectionsEntry[]}
 */

/**
 * Update the collections by merging the data
 * @param {import('./src/model/collection.js').Collections} data updated collection data
 * @param {modifyCollectionCallback} [modify_collection] Method which gets the
 * @returns {Promise<boolean>}
 */
export function update_collection(data, modify_collection) {
    const collections = get_collections();

    if (filled_object(data)) {
        for (const [scope, list] of Object.entries(data)) {
            if (!collections[scope]) {
                collections[scope] = [];
            }
            collections[scope] = [].concat(collections[scope], list);
        }
    }

    if (is_func(modify_collection)) {
        for (const [scope, list] of Object.entries(collections)) {
            const result = modify_collection(scope, list);
            if (is_array(result)) {
                collections[scope] = result;
            }
            // when null is undefined gets returned delete the scope and the entries
            if (is_null(result)) {
                delete collections[scope];
            }
        }
    }

    return set_collection(collections);
}

/**
 * Set the collections by replacing the existing collections
 * @param {import('./src/model/collection.js').Collections} collections
 * @returns {Promise<boolean>}
 */
export function set_collection(collections) {
    db.clear();
    return db.setObject(sort_collections(collections));
}

export { collection_entry };
