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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = void 0;
var fs = __importStar(require("fs"));
var path_1 = require("path");
var rollup = __importStar(require("rollup"));
var rollup_plugin_svelte_1 = __importDefault(require("rollup-plugin-svelte"));
var plugin_node_resolve_1 = __importDefault(require("@rollup/plugin-node-resolve"));
var plugin_alias_1 = __importDefault(require("@rollup/plugin-alias"));
var plugin_commonjs_1 = __importDefault(require("@rollup/plugin-commonjs"));
var rollup_plugin_css_only_1 = __importDefault(require("rollup-plugin-css-only"));
var file_1 = require("@lib/model/wyvr/file");
var file_2 = require("./file");
var Client = /** @class */ (function () {
    function Client() {
    }
    Client.create_bundles = function (cwd, files, hydrate_files) {
        return __awaiter(this, void 0, void 0, function () {
            var client_root;
            var _this = this;
            return __generator(this, function (_a) {
                client_root = path_1.join(cwd, 'gen', 'client');
                files.map(function (entry, index) { return __awaiter(_this, void 0, void 0, function () {
                    var input_file, lazy_input_files, content, input_options, output_options, bundle, output, e_1;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                input_file = path_1.join(client_root, entry.name + ".js");
                                lazy_input_files = [];
                                content = hydrate_files
                                    .map(function (file) {
                                    var _a;
                                    var import_path = file.path.replace(/^gen\/client/, '@src');
                                    var var_name = file.name.toLowerCase().replace(/\s/g, '_');
                                    if (((_a = file.config) === null || _a === void 0 ? void 0 : _a.loading) == file_1.WyvrFileLoading.lazy) {
                                        // const lazy_input_path = join(client_root, `${file.name}.js`);
                                        // lazy_input_files.push(lazy_input_path);
                                        // fs.writeFileSync(
                                        //     lazy_input_path,
                                        //     `
                                        //     import ${var_name} from '${import_path}';
                                        //     const ${var_name}_target = document.querySelectorAll('[data-hydrate="${file.name}"]');
                                        //     wyvr_hydrate(${var_name}_target, ${var_name})
                                        // `
                                        // );
                                        // return `
                                        //     const ${var_name}_target = document.querySelectorAll('[data-hydrate="${file.name}"]');
                                        //     wyvr_hydrate_lazy('./${file.path}', ${var_name}_target, '${file.name}', '${var_name}')
                                        // `;
                                        return "\n                            import " + var_name + " from '" + import_path + "';\n\n                            const " + var_name + "_target = document.querySelectorAll('[data-hydrate=\"" + file.name + "\"]');\n\n                            wyvr_hydrate_lazy('./" + file.path + "', " + var_name + "_target, '" + file.name + "', " + var_name + ")\n                        ";
                                    }
                                    // WyvrFileLoading.instant
                                    return "\n                        import " + var_name + " from '" + import_path + "';\n\n                        const " + var_name + "_target = document.querySelectorAll('[data-hydrate=\"" + file.name + "\"]');\n                        wyvr_hydrate(" + var_name + "_target, " + var_name + ")\n                    ";
                                })
                                    .join('\n');
                                fs.writeFileSync(input_file, "\n                const wyvr_hydrate = (elements, cls) => {\n                    if(!elements) {\n                        return null;\n                    }\n                    return Array.from(elements).map((el)=>{ \n                        let props = {};\n                        const json = '{'+el.getAttribute('data-props').replace(/'/g, '\"')+'}';\n                        const slots = el.querySelectorAll('[data-slot]');\n                        try {\n                            props = JSON.parse(json)\n                        } catch(e) {\n                            console.warn(json, e)\n                        }\n                        el.innerHTML = '';\n                        new cls({\n                            target: el,\n                            props: props\n                        })\n                        if(slots) {\n                            Array.from(slots).map((slot)=>{ \n                                const slot_name = slot.getAttribute('data-slot');\n                                const client_slot = el.querySelector('[data-client-slot=\"'+slot_name+'\"]')\n                                if(client_slot) {\n                                    client_slot.parentNode.insertBefore(slot, client_slot);\n                                    client_slot.remove();\n                                }\n                            });\n                        }\n                        el.setAttribute('data-hydrated', 'true');\n                        return el;\n                    })\n                }\n                const wyvr_hydrate_lazy = (path, elements, name, cls) => {\n                    /*import(path).then(module => {\n                        if(!module || !module.default) {\n                            wyvr_hydrate(elements, module.default)\n                        }\n                    });*/\n                    wyvr_loading_classes[name] = cls;\n                    return Array.from(elements).map((el)=>{\n                        wyvr_loading_observer.observe(el);\n                        return el;\n                    })\n                }\n                const wyvr_loading_classes = {};\n                const wyvr_loading_observer = new IntersectionObserver((entries) => {\n                    entries.forEach((entry) => {\n                        if (entry.isIntersecting) {\n                            const name = entry.target.getAttribute('data-hydrate');\n                            if(name) {\n                                wyvr_hydrate([entry.target], wyvr_loading_classes[name])\n                            }\n                            wyvr_loading_observer.unobserve(entry.target)\n                        }\n                    })\n                });\n                " + content + "\n                ");
                                input_options = {
                                    input: input_file,
                                    plugins: [
                                        plugin_alias_1.default({
                                            entries: [{ find: '@src', replacement: path_1.resolve('gen/client') }],
                                        }),
                                        rollup_plugin_svelte_1.default({
                                            include: ['gen/client/**/*.svelte'],
                                            emitCss: false,
                                            compilerOptions: {
                                                // By default, the client-side compiler is used. You
                                                // can also use the server-side rendering compiler
                                                generate: 'dom',
                                                // ensure that extra attributes are added to head
                                                // elements for hydration (used with generate: 'ssr')
                                                hydratable: true,
                                            },
                                        }),
                                        plugin_node_resolve_1.default({ browser: true }),
                                        plugin_commonjs_1.default(),
                                        rollup_plugin_css_only_1.default({ output: "gen/" + entry.name + ".css" }),
                                        // terser(),
                                    ],
                                };
                                output_options = {
                                    // dir: `gen/js`,
                                    file: "gen/js/" + entry.name + ".js",
                                    // sourcemap: true,
                                    format: 'iife',
                                    name: 'app',
                                };
                                _a.label = 1;
                            case 1:
                                _a.trys.push([1, 5, , 6]);
                                return [4 /*yield*/, rollup.rollup(input_options)];
                            case 2:
                                bundle = _a.sent();
                                return [4 /*yield*/, bundle.generate(output_options)];
                            case 3:
                                output = (_a.sent()).output;
                                return [4 /*yield*/, bundle.write(output_options)];
                            case 4:
                                _a.sent();
                                return [3 /*break*/, 6];
                            case 5:
                                e_1 = _a.sent();
                                console.error(e_1);
                                return [2 /*return*/, false];
                            case 6: return [2 /*return*/, true];
                        }
                    });
                }); });
                return [2 /*return*/];
            });
        });
    };
    Client.collect_svelte_files = function (dir) {
        var _this = this;
        if (dir === void 0) { dir = null; }
        if (!dir) {
            dir = path_1.join(process.cwd(), 'src');
        }
        var entries = fs.readdirSync(dir);
        var result = [];
        entries.forEach(function (entry) {
            var path = path_1.join(dir, entry);
            var stat = fs.statSync(path);
            if (stat.isDirectory()) {
                result.push.apply(result, _this.collect_svelte_files(path));
                return;
            }
            if (stat.isFile() && entry.match(/\.svelte$/)) {
                result.push(new file_1.WyvrFile(path));
            }
        });
        return result;
    };
    Client.correct_svelte_file_import_paths = function (svelte_files) {
        //HydrateFileEntry[] {
        return svelte_files.map(function (file) {
            var content = fs.readFileSync(file.path, { encoding: 'utf-8' });
            if (content) {
                var corrected_imports = content.replace(/'@src\//g, "'src/").replace(/from 'src\//g, "from '" + process.cwd() + "/gen/src/");
                fs.writeFileSync(file.path, corrected_imports);
            }
            return file;
        });
    };
    Client.get_hydrateable_svelte_files = function (svelte_files) {
        //HydrateFileEntry[] {
        return svelte_files
            .map(function (file) {
            var content = fs.readFileSync(file.path, { encoding: 'utf-8' });
            var match = content.match(/wyvr:\s+(\{[^}]+\})/);
            if (match) {
                var config_1 = null;
                try {
                    config_1 = new file_1.WyvrFileConfig();
                    match[1].split('\n').forEach(function (row) {
                        var cfg_string = row.match(/(\w+): '(\w+)'/);
                        if (cfg_string) {
                            config_1[cfg_string[1]] = cfg_string[2];
                            return;
                        }
                        var cfg_bool = row.match(/(\w+): (true|false)/);
                        if (cfg_bool) {
                            config_1[cfg_bool[1]] = cfg_bool[2] === 'true';
                            return;
                        }
                        var cfg_number = row.match(/(\w+): (\d+)/);
                        if (cfg_number) {
                            config_1[cfg_number[1]] = parseFloat(cfg_number[2]);
                            return;
                        }
                    });
                }
                catch (e) {
                    // add error object
                    config_1.error = e;
                }
                file.config = config_1;
                return file;
            }
            return null;
        })
            .filter(function (x) { return x; });
    };
    Client.transform_hydrateable_svelte_files = function (files) {
        var _this = this;
        //HydrateFileEntry[]) {
        return files.map(function (entry) {
            if (entry.config.render == file_1.WyvrFileRender.hydrate) {
                // split svelte file apart to inject markup for the hydration
                var content = fs.readFileSync(entry.path, { encoding: 'utf-8' });
                // extract scripts
                var script_result = _this.extract_tags_from_content(content, 'script');
                entry.scripts = script_result.result;
                content = script_result.content;
                entry.props = _this.extract_props_from_scripts(script_result.result);
                var props_include = "data-props=\"" + entry.props.map(function (prop) { return "'" + prop + "':{JSON.stringify(" + prop + ").replace(/\"/g, \"'\")}"; }).join(',') + "\"";
                // extract styles
                var style_result = _this.extract_tags_from_content(content, 'style');
                entry.styles = style_result.result;
                content = style_result.content;
                // add hydrate tag
                var hydrate_tag = entry.config.display == 'inline' ? 'span' : 'div';
                content = "<" + hydrate_tag + " data-hydrate=\"" + entry.name + "\" " + props_include + ">" + content + "</" + hydrate_tag + ">";
                content = _this.replace_slots_static(content);
                fs.writeFileSync(entry.path, entry.scripts.join('') + "\n" + entry.styles.join('') + "\n" + content);
            }
            return entry;
        });
    };
    Client.extract_tags_from_content = function (content, tag) {
        var search_tag = true;
        tag = tag.toLowerCase().trim();
        var result = [];
        var tag_start = "<" + tag;
        var tag_end = "</" + tag + ">";
        var tag_start_index, tag_end_index;
        while (search_tag) {
            tag_start_index = content.indexOf(tag_start);
            tag_end_index = content.indexOf(tag_end);
            if (tag_start_index > -1 && tag_end_index > -1) {
                // append the tag into the result
                result.push(content.slice(tag_start_index, tag_end_index + tag_end.length));
                // remove the script from the content
                content = content.substr(0, tag_start_index) + content.substr(tag_end_index + tag_end.length);
                continue;
            }
            search_tag = false;
        }
        return {
            content: content,
            result: result,
        };
    };
    Client.get_entrypoint_name = function (root_paths) {
        var parts = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            parts[_i - 1] = arguments[_i];
        }
        var replace_pattern = new RegExp("^" + root_paths.map(function (path) { return path.replace(/\//g, '/') + '/'; }).join('|'));
        return parts
            .map(function (part) {
            // remove the root paths to get shorter entrypoints
            return part
                .replace(replace_pattern, '')
                .replace(/\.svelte$/, '')
                .toLowerCase();
        })
            .filter(function (p, i, arr) {
            // remove duplicate entries
            return arr.indexOf(p) == i;
        })
            .join('_');
    };
    Client.replace_global = function (content, global_data) {
        var _this = this;
        if (global_data === void 0) { global_data = null; }
        return content.replace(/getGlobal\(['"]([^'"]+)['"](?:,\s*([^\)]+))?\)/g, function (matched, key, fallback) {
            // getGlobal('nav.header')
            // getGlobal("nav.header")
            // getGlobal('nav.header[0]')
            // getGlobal('nav.header', [])
            // getGlobal('nav.header', true)
            // getGlobal('nav.header', 'test')
            try {
                fallback = JSON.parse(fallback);
            }
            catch (e) {
                fallback = null;
            }
            return JSON.stringify(_this.get_global(key, fallback || null, global_data));
        });
    };
    Client.get_global = function (key, fallback, global_data) {
        if (fallback === void 0) { fallback = null; }
        if (global_data === void 0) { global_data = null; }
        if (!key || !global_data) {
            return fallback;
        }
        var steps = key.split('.');
        var value = fallback;
        for (var i = 0; i < steps.length; i++) {
            var step = steps[i];
            var index = null;
            // searches an element at an specific index
            if (step.indexOf('[') > -1 && step.indexOf(']') > -1) {
                var match = step.match(/^([^\[]+)\[([^\]]+)\]$/);
                if (match) {
                    step = match[1];
                    index = parseInt((match[2] + '').trim(), 10);
                }
            }
            if (i == 0) {
                value = global_data[step];
                if (index != null && Array.isArray(value)) {
                    value = value[index];
                }
                continue;
            }
            if (!value && !value[step]) {
                return fallback;
            }
            value = value[step];
            if (index != null && Array.isArray(value)) {
                value = value[index];
            }
        }
        return value;
    };
    Client.extract_props_from_scripts = function (scripts) {
        var props = [];
        scripts.forEach(function (script) {
            //export let price = null;
            script.replace(/export let ([^ =]*)\s*=.*/g, function (_, prop) {
                props.push(prop);
                return '';
            });
        });
        return props;
    };
    Client.replace_slots_static = function (content) {
        var content_replaced = content.replace(/(<slot[^>/]*>.*?<\/slot>|<slot[^>]*\/>)/g, function (_, slot) {
            var match = slot.match(/name="(.*)"/);
            var name = null;
            if (match) {
                name = match[1];
            }
            return "<div data-slot=\"" + (name || 'default') + "\">" + slot + "</div>";
        });
        return content_replaced;
    };
    Client.replace_slots_client = function (content) {
        var content_replaced = content.replace(/(<slot[^>/]*>.*?<\/slot>|<slot[^>]*\/>)/g, function (_, slot) {
            var match = slot.match(/name="(.*)"/);
            var name = null;
            if (match) {
                name = match[1];
            }
            return "<div data-client-slot=\"" + (name || 'default') + "\">" + slot + "</div>";
        });
        return content_replaced;
    };
    Client.insert_splits = function (file_path, content) {
        var css_file = file_2.File.to_extension(file_path, 'css');
        if (fs.existsSync(css_file)) {
            var css_content = fs.readFileSync(css_file);
            var css_result = this.extract_tags_from_content(content, 'style');
            var combined_css = css_result.result.map(function (style) {
                return style.replace(/^<style>/, '').replace(/<\/style>$/, '');
            }).join('\n');
            content = css_result.content + "<style>" + combined_css + css_content + "</style>";
        }
        var js_file = file_2.File.to_extension(file_path, 'js');
        if (fs.existsSync(js_file)) {
            var js_content = fs.readFileSync(js_file);
            var js_result = this.extract_tags_from_content(content, 'script');
            var combined_js = js_result.result.map(function (script) {
                return script.replace(/^<script>/, '').replace(/<\/script>$/, '');
            }).join('\n');
            content = "<script>" + combined_js + js_content + "</script>" + js_result.content;
        }
        return content;
    };
    return Client;
}());
exports.Client = Client;
//# sourceMappingURL=client.js.map