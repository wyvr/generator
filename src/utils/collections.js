import { clone } from './json.js';
import { filled_array, filled_object, filled_string, in_array, is_array, is_null } from './validate.js';

export function append_entry_to_collections(collections, entry) {
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

export function build_collection(value, url, name, mtime) {
    const collections = [];
    if (filled_object(value)) {
        if (value?.scope != 'all') {
            const all_entry = clone(value);
            all_entry.scope = 'all';
            collections.push(build_collection_entry(all_entry, url, name, mtime));
        }
        collections.push(build_collection_entry(value, url, name, mtime));
    }
    if (is_array(value)) {
        // search if all scope is already there and avoid adding multiple entries
        if (!value.find((entry) => entry?.scope == 'all')) {
            collections.push(build_collection_entry({ scope: 'all' }, url, name, mtime));
        }
        const keys = [];
        value
            .filter((x) => filled_object(x))
            .forEach((x) => {
                const entry = build_collection_entry(x, url, name, mtime);
                // void multiple entries of the same scope
                if (in_array(keys, entry.scope)) {
                    collections.find((item) => {
                        if (item.scope == entry.scope) {
                            Object.keys(entry).forEach((key) => {
                                if (!is_null(x[key])) {
                                    item[key] = x[key];
                                }
                            });
                            return true;
                        }
                        return false;
                    });
                    return;
                }
                keys.push(entry.scope);
                collections.push(entry);
            });
    }
    if (!filled_array(collections) && filled_string(url)) {
        collections.push(build_collection_entry({ scope: 'all' }, url, name, mtime));
    }
    return collections;
}

export function build_collection_entry(entry, url, name, mtime) {
    const result = {
        name: undefined,
        order: 0,
        scope: 'none',
        visible: true,
        url: '',
        mtime,
    };
    if (filled_string(url)) {
        result.url = url;
    }
    if (filled_string(name)) {
        result.name = name;
    }
    Object.keys(result).forEach((key) => {
        if (!is_null(entry[key])) {
            result[key] = entry[key];
        }
    });
    return result;
}
