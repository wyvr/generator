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
exports.Main = void 0;
var fs = __importStar(require("fs-extra"));
var uuid_1 = require("uuid");
var generate_1 = require("@lib/generate");
var link_1 = require("@lib/link");
var importer_1 = require("@lib/importer");
var dir_1 = require("@lib/dir");
var logger_1 = require("@lib/logger");
var controller_1 = require("@lib/worker/controller");
var config_1 = require("@lib/config");
var env_1 = require("@lib/env");
var env_2 = require("@lib/model/env");
var queue_1 = require("@lib/queue");
var action_1 = require("@lib/model/worker/action");
var status_1 = require("./model/worker/status");
var performance_measure_1 = require("@lib/performance_measure");
var file_1 = require("./file");
var client_1 = require("./client");
var path_1 = require("path");
var Main = /** @class */ (function () {
    function Main() {
        this.queue = null;
        this.worker_controller = null;
        this.global_data = null;
        this.entrypoints = {};
        this.ticks = 0;
        env_1.Env.set(process.env.WYVR_ENV);
        this.init();
    }
    Main.prototype.init = function () {
        return __awaiter(this, void 0, void 0, function () {
            var hr_start, uniq_id, pid, cwd, project_config, datasets_total, is_imported, importer, e_1, _a, workers, collected_files, build_pages, build_scripts, hr_end, timeInMs;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        hr_start = process.hrtime();
                        uniq_id = uuid_1.v4().split('-')[0];
                        pid = process.pid;
                        cwd = process.cwd();
                        process.title = "wyvr main " + pid;
                        logger_1.Logger.logo();
                        logger_1.Logger.present('PID', pid, logger_1.Logger.color.dim("\"" + process.title + "\""));
                        logger_1.Logger.present('cwd', cwd);
                        logger_1.Logger.present('build', uniq_id);
                        logger_1.Logger.present('env', env_2.EnvModel[env_1.Env.get()]);
                        project_config = config_1.Config.get();
                        logger_1.Logger.debug('project_config', project_config);
                        this.perf = config_1.Config.get('import.measure_performance') ? new performance_measure_1.Performance_Measure() : new performance_measure_1.Performance_Measure_Blank();
                        dir_1.Dir.create('pub');
                        datasets_total = null;
                        is_imported = false;
                        importer = new importer_1.Importer();
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        this.global_data = file_1.File.read_json('./data/global.json');
                        return [4 /*yield*/, importer.import('./data/sample.json', function (data) {
                                return _this.generate(data);
                            }, function () {
                                is_imported = true;
                                importer.set_global(_this.global_data);
                            })];
                    case 2:
                        datasets_total = _b.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        e_1 = _b.sent();
                        logger_1.Logger.error(e_1);
                        return [2 /*return*/];
                    case 4:
                        if (!datasets_total) {
                            logger_1.Logger.error('no datasets found');
                            return [2 /*return*/];
                        }
                        if (!!is_imported) return [3 /*break*/, 6];
                        _a = this;
                        return [4 /*yield*/, importer.get_global()];
                    case 5:
                        _a.global_data = _b.sent();
                        _b.label = 6;
                    case 6:
                        this.worker_controller = new controller_1.WorkerController(this.global_data);
                        this.worker_amount = this.worker_controller.get_worker_amount();
                        logger_1.Logger.present('workers', this.worker_amount, logger_1.Logger.color.dim("of " + require('os').cpus().length + " cores"));
                        workers = this.worker_controller.create_workers(this.worker_amount);
                        this.worker_controller.on_entrypoint(function (data) {
                            _this.entrypoints[data.entrypoint] = {
                                name: data.entrypoint,
                                doc: data.doc,
                                layout: data.layout,
                                page: data.page,
                            };
                        });
                        // Process files in workers
                        this.perf.start('collect');
                        return [4 /*yield*/, this.collect()];
                    case 7:
                        collected_files = _b.sent();
                        this.perf.end('collect');
                        // Process files in workers
                        this.perf.start('build');
                        return [4 /*yield*/, this.build(importer.get_import_list())];
                    case 8:
                        build_pages = _b.sent();
                        this.perf.end('build');
                        this.perf.start('scripts');
                        return [4 /*yield*/, this.scripts()];
                    case 9:
                        build_scripts = _b.sent();
                        this.perf.end('scripts');
                        // const content = `
                        // <script>
                        // import Page from '${process.cwd()}/src/page/Default.svelte';
                        // const data = ${JSON.stringify({ title: 'test' })};
                        // </script>
                        // <Page data={data}>
                        // Inhalt
                        // </Page>
                        // `;
                        // fs.writeFileSync('generated/test.svelte', content, {encoding: 'utf-8'});
                        // const component = Build.compile(content);
                        // console.log('component', component)
                        // const rendered = Build.render(component, { name: 'P@', details: true });
                        // console.log('rendered');
                        // console.log(rendered.result.html)
                        // await bundle.build(filename)
                        // const demo_file = `
                        // <!doctype html>
                        // <html>
                        //     <head>
                        //         <link href="/assets/global.css?${uniq_id}" rel="stylesheet" />
                        //     </head>
                        //     <body>
                        //         ${rendered.result.html}
                        //         <script src="/bundle.js?${uniq_id}"></script>
                        //     </body>
                        // </html>`;
                        // fs.writeFileSync('./pub/index.html', demo_file);
                        // symlink the "static" folders to pub
                        link_1.Link.to_pub('assets');
                        link_1.Link.to_pub('gen/js', 'js');
                        hr_end = process.hrtime(hr_start);
                        timeInMs = (hr_end[0] * 1000000000 + hr_end[1]) / 1000000;
                        logger_1.Logger.success('total execution time', timeInMs, 'ms');
                        if (env_1.Env.is_prod()) {
                            setTimeout(function () {
                                logger_1.Logger.success('shutdown');
                                process.exit(0);
                            }, 500);
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    Main.prototype.collect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var svelte_files, hydrateable_files, transformed_files;
            var _this = this;
            return __generator(this, function (_a) {
                fs.copySync('src', 'gen/src');
                svelte_files = client_1.Client.collect_svelte_files('gen/src');
                // replace global data in the svelte files
                svelte_files.map(function (file) {
                    var raw_content = fs.readFileSync(file.path, { encoding: 'utf-8' });
                    var combined_content = client_1.Client.insert_splits(file.path, raw_content);
                    var content = client_1.Client.replace_global(combined_content, _this.global_data);
                    fs.writeFileSync(file.path, content);
                });
                hydrateable_files = client_1.Client.get_hydrateable_svelte_files(svelte_files);
                // copy the hydrateable files into the gen/client folder
                fs.mkdirSync('gen/client', { recursive: true });
                hydrateable_files.map(function (file) {
                    var source_path = file.path;
                    var path = file.path.replace(/^gen\/src/, 'gen/client');
                    fs.mkdirSync(path_1.dirname(path), { recursive: true });
                    fs.writeFileSync(path, client_1.Client.replace_slots_client(fs.readFileSync(source_path, { encoding: 'utf-8' })));
                    return file;
                });
                // correct the import paths in the static files
                client_1.Client.correct_svelte_file_import_paths(svelte_files);
                transformed_files = client_1.Client.transform_hydrateable_svelte_files(hydrateable_files);
                return [2 /*return*/, {
                        src: svelte_files,
                        client: transformed_files,
                    }];
            });
        });
    };
    Main.prototype.build = function (list) {
        return __awaiter(this, void 0, void 0, function () {
            var amount, batch_size, runs, i, queue_data;
            var _this = this;
            return __generator(this, function (_a) {
                fs.mkdirSync('gen/src', { recursive: true });
                logger_1.Logger.info('build datasets', list.length);
                // create new queue
                this.queue = new queue_1.Queue();
                amount = list.length;
                batch_size = 10;
                runs = Math.ceil(amount / batch_size);
                logger_1.Logger.info('build runs', runs);
                for (i = 0; i < runs; i++) {
                    queue_data = {
                        action: action_1.WorkerAction.build,
                        data: list.slice(i * batch_size, (i + 1) * batch_size),
                    };
                    this.queue.push(queue_data);
                }
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var listener_id = _this.worker_controller.on(status_1.WorkerStatus.idle, function () {
                            if (_this.tick(_this.queue)) {
                                _this.worker_controller.off(listener_id);
                                resolve(true);
                            }
                        });
                    })];
            });
        });
    };
    Main.prototype.scripts = function () {
        return __awaiter(this, void 0, void 0, function () {
            var keys, amount, batch_size, runs, i, queue_data;
            var _this = this;
            return __generator(this, function (_a) {
                fs.mkdirSync('gen/js', { recursive: true });
                keys = Object.keys(this.entrypoints);
                amount = keys.length;
                logger_1.Logger.info('build scripts', amount);
                // create new queue
                this.queue = new queue_1.Queue();
                batch_size = 10;
                runs = Math.ceil(amount / batch_size);
                logger_1.Logger.info('build runs', runs);
                for (i = 0; i < runs; i++) {
                    queue_data = {
                        action: action_1.WorkerAction.scripts,
                        data: keys.slice(i * batch_size, (i + 1) * batch_size).map(function (key) { return _this.entrypoints[key]; }),
                    };
                    this.queue.push(queue_data);
                }
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var listener_id = _this.worker_controller.on(status_1.WorkerStatus.idle, function () {
                            if (_this.tick(_this.queue)) {
                                _this.worker_controller.off(listener_id);
                                resolve(true);
                            }
                        });
                    })];
            });
        });
    };
    Main.prototype.tick = function (queue) {
        var _this = this;
        var workers = this.worker_controller.get_idle_workers();
        this.ticks++;
        if (workers.length == this.worker_amount && queue.length == 0) {
            return true;
        }
        if (queue.length > 0) {
            // get all idle workers
            if (workers.length > 0) {
                workers.forEach(function (worker) {
                    var queue_entry = queue.take();
                    if (queue_entry != null) {
                        // set worker busy otherwise the same worker gets multiple actions send
                        worker.status = status_1.WorkerStatus.busy;
                        // send the data to the worker
                        _this.worker_controller.send_action(worker.pid, queue_entry.action, queue_entry.data);
                    }
                });
            }
        }
        return false;
    };
    Main.prototype.generate = function (data) {
        // enhance the data from the pages
        data.value = generate_1.Generate.enhance_data(data.value);
        // extract navigation data
        var nav_result = data.value._wyvr.nav;
        if (nav_result) {
            if (!this.global_data.nav) {
                this.global_data.nav = {};
            }
            if (!this.global_data.nav.all) {
                this.global_data.nav.all = [];
            }
            if (nav_result.scope) {
                if (!this.global_data.nav[nav_result.scope]) {
                    this.global_data.nav[nav_result.scope] = [];
                }
                this.global_data.nav[nav_result.scope].push(nav_result);
            }
            this.global_data.nav.all.push(nav_result);
        }
        return data;
    };
    return Main;
}());
exports.Main = Main;
//# sourceMappingURL=main.js.map