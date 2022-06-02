import { to_svelte_paths } from '../utils/to.js';
import { filled_object, filled_string, is_array, is_null, is_string } from '../utils/validate.js';

export function WyvrData(data, url) {
    // enrich _wyvr property
    // this are the default values
    const wyvr_prop = {
        template: {
            doc: to_svelte_paths('Default'),
            layout: to_svelte_paths('Default'),
            page: to_svelte_paths('Default'),
        },
        nav: [],
        extension: 'html',
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

    // prepare nav property
    if (!is_null(data.nav) && filled_string(url)) {
        // allow to add multiple nav entries per page
        const nav = Array.isArray(data.nav) ? data.nav : [data.nav];
        wyvr_prop.nav = nav
            .filter((x) => filled_object(x))
            .map((nav) => {
                let visible = nav.visible;
                if (is_null(visible)) {
                    visible = true;
                }
                nav.scope = nav.scope || 'default';
                nav.url = url;
                nav.visible = visible;
                nav.order = nav.order || 0;
                return nav;
            });
    }

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
