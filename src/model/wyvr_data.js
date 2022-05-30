import { to_extension } from '../utils/file.js';
import { to_svelte_paths } from '../utils/to.js';
import { is_null } from '../utils/validate.js';

export function WyvrData(data) {
    // enrich _wyvr property
    // this are the default values
    const wyvr_prop = {
        template: {
            doc: to_svelte_paths(['Default']),
            layout: to_svelte_paths(['Default']),
            page: to_svelte_paths(['Default']),
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

    if (data.template) {
        // use the given templates for all types
        // "template": "about"
        // "template": [ "about", "Page", "column/1" ]
        if (typeof data._wyvr.template == 'string' || Array.isArray(data._wyvr.template)) {
            wyvr_prop.template.doc = this.merge_property(data._wyvr.template, wyvr_prop.template.doc);
            wyvr_prop.template.layout = this.merge_property(data._wyvr.template, wyvr_prop.template.layout);
            wyvr_prop.template.page = this.merge_property(data._wyvr.template, wyvr_prop.template.page);
        } else {
            if (data._wyvr.template.doc) {
                wyvr_prop.template.doc = this.merge_property(data._wyvr.template.doc, wyvr_prop.template.doc);
            }
            if (data._wyvr.template.layout) {
                wyvr_prop.template.layout = this.merge_property(
                    data._wyvr.template.layout,
                    wyvr_prop.template.layout
                );
            }
            if (data._wyvr.template.page) {
                wyvr_prop.template.page = this.merge_property(data._wyvr.template.page, wyvr_prop.template.page);
            }
        }
    }

    // add extension to the template paths
    ['doc', 'layout', 'page'].forEach((key) => {
        wyvr_prop.template[key] = to_svelte_paths(wyvr_prop.template[key]);
    });

    return wyvr_prop;
}

// function merge_property(prop_value: string | string[], default_value: string[]): string[] {
//     if (typeof prop_value == 'string') {
//         prop_value = [prop_value];
//     }
//     return [].concat(prop_value, default_value).filter((x, index, arr) => arr.indexOf(x) == index);
// }

function enhance_data(data) {
    if (!data) {
        return null;
    }
    // enrich _wyvr property
    // this are the default values
    const wyvr_prop = {
        template: {
            doc: ['Default'],
            layout: ['Default'],
            page: ['Default'],
        },
        nav: [],
        extension: 'html',
        language: 'en',
        private: false,
        change_frequence: 'monthly',
        priority: 0.5,
        static: false,
    };

    if (data._wyvr) {
        if (data._wyvr.template) {
            // use the given templates for all types
            // "template": "about"
            // "template": [ "about", "Page", "column/1" ]
            if (typeof data._wyvr.template == 'string' || Array.isArray(data._wyvr.template)) {
                wyvr_prop.template.doc = this.merge_property(data._wyvr.template, wyvr_prop.template.doc);
                wyvr_prop.template.layout = this.merge_property(data._wyvr.template, wyvr_prop.template.layout);
                wyvr_prop.template.page = this.merge_property(data._wyvr.template, wyvr_prop.template.page);
            } else {
                if (data._wyvr.template.doc) {
                    wyvr_prop.template.doc = this.merge_property(data._wyvr.template.doc, wyvr_prop.template.doc);
                }
                if (data._wyvr.template.layout) {
                    wyvr_prop.template.layout = this.merge_property(
                        data._wyvr.template.layout,
                        wyvr_prop.template.layout
                    );
                }
                if (data._wyvr.template.page) {
                    wyvr_prop.template.page = this.merge_property(data._wyvr.template.page, wyvr_prop.template.page);
                }
            }
        }
        if (data._wyvr.nav) {
            // allow to add multiple nav entries per page
            const nav = Array.isArray(data._wyvr.nav) ? data._wyvr.nav : [data._wyvr.nav];
            wyvr_prop.nav = nav
                .filter((x) => x)
                .map((nav) => {
                    let visible = nav.visible;
                    if (visible == null) {
                        visible = true;
                    }
                    nav.url = data.url;
                    nav.visible = visible;
                    nav.scope = nav.scope || null;
                    nav.order = nav.order || 0;
                    return nav;
                });
        }
    }
    // add extension to the template paths
    wyvr_prop.template.doc = wyvr_prop.template.doc.map((file) => to_extension(file, 'svelte'));
    wyvr_prop.template.layout = wyvr_prop.template.layout.map((file) => to_extension(file, 'svelte'));
    wyvr_prop.template.page = wyvr_prop.template.page.map((file) => to_extension(file, 'svelte'));

    // add simple props
    ['extension', 'language', 'private', 'change_frequence', 'priority', 'static'].forEach((key) => {
        if (data && data._wyvr && data._wyvr[key] != null) {
            wyvr_prop[key] = data._wyvr[key];
        }
    });

    // set the new values
    data._wyvr = wyvr_prop;

    return data;
}
