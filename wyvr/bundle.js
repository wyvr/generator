"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bundle = void 0;
var rollup = require('rollup');
var svelte = require('rollup-plugin-svelte');
var resolve = require('@rollup/plugin-node-resolve').default;
var Bundle = /** @class */ (function () {
    function Bundle() {
    }
    Bundle.build = function (filename) {
        return __awaiter(this, void 0, void 0, function () {
            var options, bundle, e_1, logger, _i, logger_1, chunkOrAsset;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!filename) {
                            return [2 /*return*/, null];
                        }
                        options = Object.assign({
                            input: filename,
                        }, logger_options);
                        bundle = null;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, rollup.rollup(options)];
                    case 2:
                        bundle = _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        e_1 = _a.sent();
                        console.log(e_1);
                        return [3 /*break*/, 4];
                    case 4:
                        if (!bundle) {
                            return [2 /*return*/, null];
                        }
                        return [4 /*yield*/, bundle.generate(options)];
                    case 5:
                        logger = (_a.sent()).logger;
                        for (_i = 0, logger_1 = logger; _i < logger_1.length; _i++) {
                            chunkOrAsset = logger_1[_i];
                            if (chunkOrAsset.type === 'asset') {
                                // For assets, this contains
                                // {
                                //   fileName: string,              // the asset file name
                                //   source: string | Uint8Array    // the asset source
                                //   type: 'asset'                  // signifies that this is an asset
                                // }
                                console.log('Asset', chunkOrAsset);
                            }
                            else {
                                // For chunks, this contains
                                // {
                                //   code: string,                  // the generated JS code
                                //   dynamicImports: string[],      // external modules imported dynamically by the chunk
                                //   exports: string[],             // exported variable names
                                //   facadeModuleId: string | null, // the id of a module that this chunk corresponds to
                                //   fileName: string,              // the chunk file name
                                //   implicitlyLoadedBefore: string[]; // entries that should only be loaded after this chunk
                                //   imports: string[],             // external modules imported statically by the chunk
                                //   importedBindings: {[imported: string]: string[]} // imported bindings per dependency
                                //   isDynamicEntry: boolean,       // is this chunk a dynamic entry point
                                //   isEntry: boolean,              // is this chunk a static entry point
                                //   isImplicitEntry: boolean,      // should this chunk only be loaded after other chunks
                                //   map: string | null,            // sourcemaps if present
                                //   modules: {                     // information about the modules in this chunk
                                //     [id: string]: {
                                //       renderedExports: string[]; // exported variable names that were included
                                //       removedExports: string[];  // exported variable names that were removed
                                //       renderedLength: number;    // the length of the remaining code in this module
                                //       originalLength: number;    // the original length of the code in this module
                                //     };
                                //   },
                                //   name: string                   // the name of this chunk as used in naming patterns
                                //   referencedFiles: string[]      // files referenced via import.meta.ROLLUP_FILE_URL_<id>
                                //   type: 'chunk',                 // signifies that this is a chunk
                                // }
                                console.log('Chunk', chunkOrAsset.modules);
                            }
                        }
                        // or write the bundle to disk
                        return [4 /*yield*/, bundle.write(options)];
                    case 6:
                        // or write the bundle to disk
                        _a.sent();
                        // closes the bundle
                        return [4 /*yield*/, bundle.close()];
                    case 7:
                        // closes the bundle
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return Bundle;
}());
exports.Bundle = Bundle;
// @see https://github.com/sveltejs/rollup-plugin-svelte
var logger_options = {
    logger: {
        name: 'bundle',
        file: 'pub/bundle.js',
        format: 'iife',
    },
    plugins: [
        svelte({
            // You can restrict which files are compiled
            // using `include` and `exclude`
            // include: 'src/components/**/*.svelte',
            include: 'src/**/*.svelte',
            compilerOptions: {
                hydratable: true,
            },
            // Optionally, preprocess components with svelte.preprocess:
            // https://svelte.dev/docs#svelte_preprocess
            // preprocess: {
            //     style: ({ content }) => {
            //         return transformStyles(content);
            //     },
            // },
            // Emit CSS as "files" for other plugins to process. default is true
            emitCss: false,
            onwarn: function (warning, handler) {
                // e.g. don't warn on <marquee> elements, cos they're cool
                if (warning.code === 'a11y-distracting-elements')
                    return;
                // let Rollup handle all other warnings normally
                handler(warning);
            },
        }),
        // see NOTICE below
        resolve({ browser: true }),
    ],
};
//# sourceMappingURL=bundle.js.map