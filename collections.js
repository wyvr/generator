import { Storage } from './src/utils/storage.js';
import { filled_object, is_array, is_func, is_null } from './src/utils/validate.js';
import { sort_collections } from './src/utils/collections.js';
import { collection_entry } from './src/model/collection.js';
import { FOLDER_STORAGE } from './src/constants/folder.js';

Storage.set_location(FOLDER_STORAGE);
/**
 * Get the collections
 * @returns {Promise<import('./src/model/collection.js').Collections>}
 */
export async function get_collections() {
    return await Storage.get('collection', '*');
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
export async function update_collection(data, modify_collection) {
    const collections = await get_collections();

    if (filled_object(data)) {
        Object.entries(data).forEach(([scope, list]) => {
            if (!collections[scope]) {
                collections[scope] = [];
            }
            collections[scope] = [].concat(collections[scope], list);
        });
    }

    if (is_func(modify_collection)) {
        Object.entries(collections).forEach(([scope, list]) => {
            const result = modify_collection(scope, list);
            if (is_array(result)) {
                collections[scope] = result;
            }
            // when null is undefined gets returned delete the scope and the entries
            if (is_null(result)) {
                delete collections[scope];
            }
        });
    }

    return await set_collection(collections);
}

/**
 * Set the collections by replacing the existing collections
 * @param {import('./src/model/collection.js').Collections} collections
 * @returns {Promise<boolean>}
 */
export async function set_collection(collections) {
    await Storage.clear('collection');
    return await Storage.set('collection', sort_collections(collections));
}

export { collection_entry };
