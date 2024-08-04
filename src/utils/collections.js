import { collection_entry } from '../model/collection.js';
import { clone } from './json.js';
import {
    filled_array,
    filled_object,
    filled_string,
    in_array,
    is_array,
    is_null,
    is_object,
} from './validate.js';

/**
 * Append single CollectionEntry to a collection
 * This method modifies the given collection
 * @param {import('../model/collection.js').Collections} collections
 * @param {import('../model/collection.js').CollectionEntry} entry
 * @returns
 */

export function append_entry_to_collections(collections, entry) {
    if (!is_object(collections)) {
        return {};
    }
    if (!entry || !filled_string(entry.url) || !filled_string(entry.scope)) {
        return collections;
    }
    const scope = entry.scope;
    if (!collections[scope]) {
        collections[scope] = [];
    }
    delete entry.scope;
    collections[scope].push(entry);
    return collections;
}

/**
 * Build CollectionEntry Array from page data _wyvr.collection which can be an array or an object
 * @param {import('../model/collection.js').CollectionEntry|import('../model/collection.js').CollectionEntry[]} data
 * @param {string} url
 * @param {string} name
 * @param {Object} [mtime]
 * @returns
 */
export function build_collection(data, url, name, mtime) {
    const collections = [];
    if (filled_object(data)) {
        if (data?.scope !== 'all') {
            const all_entry = clone(data);
            all_entry.scope = 'all';
            collections.push(collection_entry(all_entry, { url, name, mtime }));
        }
        collections.push(collection_entry(data, { url, name, mtime }));
    }
    if (is_array(data)) {
        // search if all scope is already there and avoid adding multiple entries
        if (!data.find((entry) => entry?.scope === 'all')) {
            collections.push(
                collection_entry({ url, name, scope: 'all', mtime })
            );
        }
        const keys = [];
        for (const raw_entry of data.filter((x) => filled_object(x))) {
            const entry = collection_entry(raw_entry, { url, name, mtime });
            // void multiple entries of the same scope
            if (in_array(keys, entry.scope)) {
                for (const item of collections) {
                    if (item.scope === entry.scope) {
                        for (const key of Object.keys(entry)) {
                            if (!is_null(raw_entry[key])) {
                                item[key] = raw_entry[key];
                            }
                        }
                        break;
                    }
                }
                continue;
            }
            keys.push(entry.scope);
            collections.push(entry);
        }
    }
    if (!filled_array(collections) && filled_string(url)) {
        collections.push(collection_entry({ url, name, scope: 'all', mtime }));
    }
    return collections;
}

/**
 * Merge collections into a single collection and return it
 * @param  {import('../model/collection.js').Collections[]} collections_list
 * @returns {import('../model/collection.js').Collections}
 */
export function merge_collections(...collections_list) {
    const result = {};
    for (const collections of collections_list) {
        if (!is_object(collections)) {
            continue;
        }
        for (const [scope, list] of Object.entries(collections)) {
            if (!result[scope]) {
                result[scope] = [];
            }
            result[scope] = [].concat(
                result[scope],
                list.map((entry) => {
                    delete entry.scope;
                    return entry;
                })
            );
        }
    }
    return result;
}

/**
 * Sort the entries in the collections
 * @param {import('../model/collection.js').Collections} collections
 * @returns {import('../model/collection.js').Collections}
 */
export function sort_collections(collections) {
    for (const key of Object.keys(collections)) {
        if (!is_array(collections[key])) {
            continue;
        }
        collections[key] = collections[key]
            .sort((a, b) => a.url.localeCompare(b.url))
            .sort((a, b) => {
                if (a.order > b.order) {
                    return -1;
                }
                if (a.order < b.order) {
                    return 1;
                }
                return 0;
            });
    }
    return collections;
}
