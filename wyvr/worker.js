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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Worker = void 0;
var helper_1 = require("@lib/worker/helper");
var status_1 = require("@lib/model/worker/status");
var action_1 = require("@lib/model/worker/action");
var file_1 = require("@lib/file");
var build_1 = require("@lib/build");
var dir_1 = require("@lib/dir");
var path_1 = require("path");
var fs = __importStar(require("fs-extra"));
var log_1 = require("./model/log");
var client_1 = require("@lib/client");
var Worker = /** @class */ (function () {
    function Worker() {
        this.config = null;
        this.env = null;
        this.cwd = process.cwd();
        this.global_data = null;
        this.root_template_paths = [path_1.join(this.cwd, 'gen', 'src', 'doc'), path_1.join(this.cwd, 'gen', 'src', 'layout'), path_1.join(this.cwd, 'gen', 'src', 'page')];
        this.init();
    }
    Worker.prototype.init = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                process.title = "wyvr worker " + process.pid;
                helper_1.WorkerHelper.send_status(status_1.WorkerStatus.exists);
                process.on('message', function (msg) { return __awaiter(_this, void 0, void 0, function () {
                    var action, value, _a, build_result, svelte_files, files, e_1;
                    var _this = this;
                    var _b, _c;
                    return __generator(this, function (_d) {
                        switch (_d.label) {
                            case 0:
                                action = (_b = msg === null || msg === void 0 ? void 0 : msg.action) === null || _b === void 0 ? void 0 : _b.key;
                                value = (_c = msg === null || msg === void 0 ? void 0 : msg.action) === null || _c === void 0 ? void 0 : _c.value;
                                if (!value) {
                                    helper_1.WorkerHelper.log(log_1.LogType.warning, 'ignored message from main, no value given', msg);
                                    return [2 /*return*/];
                                }
                                _a = action;
                                switch (_a) {
                                    case action_1.WorkerAction.configure: return [3 /*break*/, 1];
                                    case action_1.WorkerAction.build: return [3 /*break*/, 2];
                                    case action_1.WorkerAction.scripts: return [3 /*break*/, 4];
                                    case action_1.WorkerAction.status: return [3 /*break*/, 9];
                                }
                                return [3 /*break*/, 10];
                            case 1:
                                // set the config of the worker by the main process
                                this.config = value === null || value === void 0 ? void 0 : value.config;
                                this.env = value === null || value === void 0 ? void 0 : value.env;
                                this.cwd = value === null || value === void 0 ? void 0 : value.cwd;
                                this.global_data = value === null || value === void 0 ? void 0 : value.global_data;
                                // only when everything is configured set the worker idle
                                if ((!this.config && this.env == null) || !this.cwd) {
                                    helper_1.WorkerHelper.log(log_1.LogType.warning, 'invalid configure value', value);
                                    return [2 /*return*/];
                                }
                                helper_1.WorkerHelper.send_status(status_1.WorkerStatus.idle);
                                return [3 /*break*/, 11];
                            case 2:
                                helper_1.WorkerHelper.send_status(status_1.WorkerStatus.busy);
                                return [4 /*yield*/, Promise.all(value.map(function (filename) { return __awaiter(_this, void 0, void 0, function () {
                                        var data, doc_file_name, layout_file_name, page_file_name, entrypoint, page_code, compiled, rendered, path;
                                        return __generator(this, function (_a) {
                                            data = file_1.File.read_json(filename);
                                            if (!data) {
                                                helper_1.WorkerHelper.log(log_1.LogType.error, 'broken/missing/empty file', filename);
                                                return [2 /*return*/];
                                            }
                                            doc_file_name = file_1.File.find_file(path_1.join(this.cwd, 'gen', 'src', 'doc'), data._wyvr.template.doc);
                                            layout_file_name = file_1.File.find_file(path_1.join(this.cwd, 'gen', 'src', 'layout'), data._wyvr.template.layout);
                                            page_file_name = file_1.File.find_file(path_1.join(this.cwd, 'gen', 'src', 'page'), data._wyvr.template.page);
                                            entrypoint = client_1.Client.get_entrypoint_name(this.root_template_paths, doc_file_name, layout_file_name, page_file_name);
                                            // add the entrypoint to the wyvr object
                                            data._wyvr.entrypoint = entrypoint;
                                            helper_1.WorkerHelper.send_action(action_1.WorkerAction.emit, {
                                                type: 'entrypoint',
                                                entrypoint: entrypoint,
                                                doc: doc_file_name,
                                                layout: layout_file_name,
                                                page: page_file_name,
                                            });
                                            page_code = build_1.Build.get_page_code(data, doc_file_name, layout_file_name, page_file_name);
                                            compiled = build_1.Build.compile(page_code);
                                            // const preprocess = await Build.preprocess(page_code);
                                            // console.log(JSON.stringify(compiled))
                                            if (compiled.error) {
                                                // svelte error messages
                                                helper_1.WorkerHelper.log(log_1.LogType.error, '[svelte]', filename, compiled);
                                                return [2 /*return*/];
                                            }
                                            rendered = build_1.Build.render(compiled, data);
                                            path = file_1.File.to_extension(filename.replace(path_1.join(this.cwd, 'imported', 'data'), 'pub'), 'html');
                                            // console.log(filename, path);
                                            dir_1.Dir.create(path_1.dirname(path));
                                            fs.writeFileSync(path, rendered.result.html);
                                            return [2 /*return*/, filename];
                                        });
                                    }); }))];
                            case 3:
                                build_result = _d.sent();
                                // console.log('result', result);
                                helper_1.WorkerHelper.send_status(status_1.WorkerStatus.idle);
                                return [3 /*break*/, 11];
                            case 4:
                                helper_1.WorkerHelper.send_status(status_1.WorkerStatus.busy);
                                svelte_files = client_1.Client.collect_svelte_files('gen/client');
                                files = client_1.Client.get_hydrateable_svelte_files(svelte_files);
                                _d.label = 5;
                            case 5:
                                _d.trys.push([5, 7, , 8]);
                                return [4 /*yield*/, client_1.Client.create_bundles(this.cwd, value, files)];
                            case 6:
                                _d.sent();
                                return [3 /*break*/, 8];
                            case 7:
                                e_1 = _d.sent();
                                // svelte error messages
                                helper_1.WorkerHelper.log(log_1.LogType.error, '[svelte]', e_1);
                                return [3 /*break*/, 8];
                            case 8:
                                helper_1.WorkerHelper.send_status(status_1.WorkerStatus.idle);
                                return [3 /*break*/, 11];
                            case 9:
                                helper_1.WorkerHelper.log(log_1.LogType.debug, 'setting status from outside is not allowed');
                                return [3 /*break*/, 11];
                            case 10:
                                helper_1.WorkerHelper.log(log_1.LogType.warning, 'unknown message action from outside', msg);
                                return [3 /*break*/, 11];
                            case 11: return [2 /*return*/];
                        }
                    });
                }); });
                process.on('uncaughtException', function (err) {
                    helper_1.WorkerHelper.log(log_1.LogType.error, 'uncaughtException', err.message, err.stack);
                    process.exit(1);
                });
                return [2 /*return*/];
            });
        });
    };
    return Worker;
}());
exports.Worker = Worker;
//# sourceMappingURL=worker.js.map