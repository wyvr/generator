"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Generate = void 0;
var file_1 = require("@lib/file");
var Generate = /** @class */ (function () {
    function Generate() {
    }
    Generate.enhance_data = function (data) {
        if (!data) {
            return null;
        }
        // enrich _wyvr property
        // this are the default values
        var wyvr_prop = {
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
                }
                else {
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
                var visible = data._wyvr.nav.visible;
                if (visible == null) {
                    visible = true;
                }
                wyvr_prop.nav.visible = visible;
                wyvr_prop.nav.name = data._wyvr.nav.name;
                wyvr_prop.nav.scope = data._wyvr.nav.scope || null;
            }
        }
        // add extension to the template paths
        wyvr_prop.template.doc = wyvr_prop.template.doc.map(function (file) { return file_1.File.to_extension(file, 'svelte'); });
        wyvr_prop.template.layout = wyvr_prop.template.layout.map(function (file) { return file_1.File.to_extension(file, 'svelte'); });
        wyvr_prop.template.page = wyvr_prop.template.page.map(function (file) { return file_1.File.to_extension(file, 'svelte'); });
        // set the new values
        data._wyvr = wyvr_prop;
        return data;
    };
    Generate.merge_property = function (prop_value, default_value) {
        if (typeof prop_value == 'string') {
            prop_value = [prop_value];
        }
        return [].concat(prop_value, default_value).filter(function (x, index, arr) { return arr.indexOf(x) == index; });
    };
    return Generate;
}());
exports.Generate = Generate;
//# sourceMappingURL=generate.js.map