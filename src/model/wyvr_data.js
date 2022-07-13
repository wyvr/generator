import { to_svelte_paths } from '../utils/to.js';
import { filled_object, filled_string, in_array, is_array, is_null, is_string } from '../utils/validate.js';

export function WyvrData(data) {
    // enrich _wyvr property
    // this are the default values
    const wyvr_prop = {
        template: {
            doc: to_svelte_paths('Default'),
            layout: to_svelte_paths('Default'),
            page: to_svelte_paths('Default'),
        },
        template_files: {
            doc: undefined,
            layout: undefined,
            page: undefined,
        },
        collection: build_collection(),
        extension: 'html',
        identifier: 'default',
        language: 'en',
        private: false,
        change_frequence: 'monthly',
        priority: 0.5,
        static: false,
    };
    // when no wyvr data is set use the default values
    if (is_null(data)) {
        return wyvr_prop;
    }

    // add simple props
    ['extension', 'language', 'private', 'change_frequence', 'priority', 'static'].forEach((key) => {
        if (!is_null(data[key])) {
            wyvr_prop[key] = data[key];
        }
    });

    // extend template data
    if (data.template) {
        // use the given templates for all types
        // "template": "about"
        // "template": [ "about", "Page", "column/1" ]
        if (is_string(data.template) || is_array(data.template)) {
            wyvr_prop.template.doc = merge_property(data.template, wyvr_prop.template.doc);
            wyvr_prop.template.layout = merge_property(data.template, wyvr_prop.template.layout);
            wyvr_prop.template.page = merge_property(data.template, wyvr_prop.template.page);
        } else {
            // use explicite templates for the different types
            if (data.template.doc) {
                wyvr_prop.template.doc = merge_property(data.template.doc, wyvr_prop.template.doc);
            }
            if (data.template.layout) {
                wyvr_prop.template.layout = merge_property(data.template.layout, wyvr_prop.template.layout);
            }
            if (data.template.page) {
                wyvr_prop.template.page = merge_property(data.template.page, wyvr_prop.template.page);
            }
        }
    }

    // add extension to the template paths
    ['doc', 'layout', 'page'].forEach((key) => {
        wyvr_prop.template[key] = to_svelte_paths(wyvr_prop.template[key]);
    });

    wyvr_prop.collection = build_collection(data.collection, data.url);

    return wyvr_prop;
}

/**
 * Convert and Merge property values together
 * @param {string | string[]} prop_value
 * @param {string[]} default_value
 * @returns
 */
function merge_property(prop_value, default_value) {
    if (typeof prop_value == 'string') {
        prop_value = [prop_value];
    }
    return [].concat(prop_value, default_value).filter((x, index, arr) => arr.indexOf(x) == index);
}

function build_collection(value, url) {
    const collections = [build_collection_entry({ scope: 'all' }, url)];
    if (filled_object(value)) {
        collections.push(build_collection_entry(value, url));
    }
    if (is_array(value)) {
        const keys = [];
        value
            .filter((x) => filled_object(x))
            .forEach((x) => {
                const entry = build_collection_entry(x, url);
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
    return collections;
}

function build_collection_entry(entry, url) {
    const result = {
        order: 0,
        scope: 'none',
        visible: true,
        url: '',
    };
    if (filled_string(url)) {
        result.url = url;
    }
    Object.keys(result).forEach((key) => {
        if (!is_null(entry[key])) {
            result[key] = entry[key];
        }
    });
    return result;
}
