import * as fs from 'fs-extra';
import { File } from '@lib/file';
import arrayToTree from 'array-to-tree';
import { Global } from '@lib/global';

export class Generate {
    static enhance_data(data: any): any {
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
        };
        /*{
                url: data.url,
                name: null,
                scope: null,
                visible: true,
                order: 0,
            }*/

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

        // add file extension
        wyvr_prop.extension = data._wyvr?.extension == null ? 'html' : data._wyvr.extension;

        // set the new values
        data._wyvr = wyvr_prop;

        return data;
    }
    static add_to_global(data: any, global: any) {
        if (!global || !data) {
            return global;
        }
        // extract navigation data
        let nav_result = data._wyvr?.nav;

        if (!nav_result) {
            return global;
        }
        // ensure global data structure
        if (!global.navigation) {
            global.navigation = {};
        }
        if (!Array.isArray(nav_result)) {
            return global;
        }
        nav_result.forEach((nav) => {
            if (nav.scope) {
                if (!global.navigation[nav.scope]) {
                    global.navigation[nav.scope] = [];
                }
                global.navigation[nav.scope].push(nav);
            }
        });
        return global;
    }
    static set_default_values(data: any, default_values: any) {
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
        const nav = await Global.get('navigation');
        if (!nav) {
            return null;
        }
        console.log('build nav', nav)

        await Promise.all(
            Object.keys(nav).map(async (index) => {
                const entry = nav[index];
                if (!Array.isArray(entry.value)) {
                    return null;
                }
                const data = entry.value
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
                Global.set(`nav.${entry.key}`, tree);
                return null;
            })
        );

        return nav;
    }
}
