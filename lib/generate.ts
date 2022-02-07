import { File } from '@lib/file';
import arrayToTree from 'array-to-tree';
import { Storage } from '@lib/storage';
import { IObject } from '@lib/interface/object';
import { Logger } from '@lib/logger';

export class Generate {
    static enhance_data(data: IObject): IObject {
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
                        wyvr_prop.template.layout = this.merge_property(data._wyvr.template.layout, wyvr_prop.template.layout);
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
        wyvr_prop.template.doc = wyvr_prop.template.doc.map((file) => File.to_extension(file, 'svelte'));
        wyvr_prop.template.layout = wyvr_prop.template.layout.map((file) => File.to_extension(file, 'svelte'));
        wyvr_prop.template.page = wyvr_prop.template.page.map((file) => File.to_extension(file, 'svelte'));

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
    static add_to_nav(data: IObject, nav_store: IObject) {
        if (!nav_store || !data) {
            return nav_store;
        }
        // extract navigation data
        const nav_result = data._wyvr?.nav;

        if (!nav_result) {
            return nav_store;
        }
        if (!Array.isArray(nav_result)) {
            return nav_store;
        }
        nav_result.forEach((nav) => {
            if (nav.scope) {
                if (!nav_store[nav.scope]) {
                    nav_store[nav.scope] = [];
                }
                nav_store[nav.scope].push(nav);
            }
        });
        return nav_store;
    }
    static set_default_values(data: IObject, default_values: IObject) {
        if (default_values) {
            Object.keys(default_values).forEach((key) => {
                if (!data[key]) {
                    data[key] = default_values[key];
                }
            });
        }
        return data;
    }
    static merge_property(prop_value: string | string[], default_value: string[]): string[] {
        if (typeof prop_value == 'string') {
            prop_value = [prop_value];
        }
        return [].concat(prop_value, default_value).filter((x, index, arr) => arr.indexOf(x) == index);
    }
    static async build_nav() {
        const [nav_error, nav] = await Storage.get('navigation', '*', []);
        // @note nav should be array of key/value
        if (nav_error) {
            Logger.error(nav_error);
            return null;
        }
        if (!Array.isArray(nav)) {
            return null;
        }

        // convert the lists in the scopes to tree structures
        let result = undefined;
        nav.forEach((scope) => {
            if (!Array.isArray(scope.value)) {
                return null;
            }
            const data = scope.value
                // sort the nav by the field order
                .sort((a, b) => {
                    if (a.order > b.order) {
                        return -1;
                    }
                    if (a.order < b.order) {
                        return 1;
                    }
                    return 0;
                })
                // make the nav deep, by url
                .map((nav) => {
                    const hierachy = nav.url.split('/').filter((x) => x);
                    nav.id = hierachy.join('/');
                    nav.parent_id = hierachy.reverse().slice(1).reverse().join('/');
                    return nav;
                });
            const tree = arrayToTree(data);
            if (!result) {
                result = {};
            }

            result[scope.key] = tree;
        });

        // store the generated nav in the nav table
        if (result) {
            await Storage.set_all('nav', result);
        }

        return result;
    }
}
