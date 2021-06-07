"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Build = void 0;
var fs = __importStar(require("fs-extra"));
var compiler_1 = require("svelte/compiler");
var register_1 = __importDefault(require("svelte/register"));
register_1.default();
var Build = /** @class */ (function () {
    function Build() {
    }
    Build.preprocess = function (content) {
        return compiler_1.preprocess(content, null, { filename: 'test' });
    };
    Build.compile = function (content) {
        // process.exit();
        try {
            var compiled = compiler_1.compile(content, {
                dev: true,
                generate: 'ssr',
                format: 'cjs',
                immutable: true,
                hydratable: true,
            });
            var component = eval(compiled.js.code);
            return { compiled: compiled, component: component, result: null, notes: [] };
        }
        catch (e) {
            e.error = true;
            return e;
        }
    };
    Build.compile_file = function (filename) {
        var content = fs.readFileSync(filename).toString();
        var result = this.compile(content);
        result.filename = filename;
        return result;
    };
    Build.render = function (svelte_render_item, props) {
        var propNames = Object.keys(props);
        if (Array.isArray(propNames) && Array.isArray(svelte_render_item.compiled.vars)) {
            // check for not used props
            var unused_props = propNames.filter(function (prop) {
                return (svelte_render_item.compiled.vars.find(function (v) {
                    return v.name == prop;
                }) == null);
            });
            if (unused_props.length > 0) {
                svelte_render_item.notes.push({ msg: 'unused props', details: unused_props });
            }
        }
        svelte_render_item.result = svelte_render_item.component.render(props);
        // inject css
        svelte_render_item.result.html = svelte_render_item.result.html.replace('</head>', "<style>" + svelte_render_item.result.css.code + "</style></head>");
        return svelte_render_item;
    };
    // precompile the components to check whether there is only global data used
    Build.precompile_components = function () {
        //@TODO implement
    };
    Build.get_page_code = function (data, doc_file_name, layout_file_name, page_file_name) {
        var code = "\n        <script>\n            import Doc from '" + doc_file_name + "';\n            import Layout from '" + layout_file_name + "';\n            import Page from '" + page_file_name + "';\n            const data = " + JSON.stringify(data) + ";\n        </script>\n\n        <Doc data={data}>\n            <Layout data={data}>\n                <Page data={data}>\n                " + (data.content || '') + "\n                </Page>\n            </Layout>\n        </Doc>";
        return code;
    };
    Build.get_entrypoint_code = function (doc_file_name, layout_file_name, page_file_name) {
        var code = "<script>\n            import { onMount } from 'svelte';\n            import Doc from '" + doc_file_name + "';\n            import Layout from '" + layout_file_name + "';\n            import Page from '" + page_file_name + "';\n            const data = null;\n        </script>\n\n        <Doc data={data}>\n            <Layout data={data}>\n                <Page data={data}>\n                here\n                </Page>\n            </Layout>\n        </Doc>";
        return code;
    };
    return Build;
}());
exports.Build = Build;
//# sourceMappingURL=build.js.map