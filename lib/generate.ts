import * as fs from 'fs-extra';
import { File } from '@lib/file';

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
            nav: {
                url: data.url,
                name: null,
                scope: null,
                visible: true
            },
            language: 'en',
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
                let visible = data._wyvr.nav.visible;
                if (visible == null) {
                    visible = true;
                }
                wyvr_prop.nav.visible = visible;
                wyvr_prop.nav.name = data._wyvr.nav.name;
                wyvr_prop.nav.scope = data._wyvr.nav.scope || null;
            }
        }
        // add extension to the template paths
        wyvr_prop.template.doc = wyvr_prop.template.doc.map((file) => File.to_extension(file, 'svelte'));
        wyvr_prop.template.layout = wyvr_prop.template.layout.map((file) => File.to_extension(file, 'svelte'));
        wyvr_prop.template.page = wyvr_prop.template.page.map((file) => File.to_extension(file, 'svelte'));

        // set the new values
        data._wyvr = wyvr_prop;

        return data;
    }
    static merge_property(prop_value: string | string[], default_value: string[]): string[] {
        if (typeof prop_value == 'string') {
            prop_value = [prop_value];
        }
        return [].concat(prop_value, default_value).filter((x, index, arr) => arr.indexOf(x) == index);
    }
}
