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
exports.Importer = void 0;
var fs = __importStar(require("fs-extra"));
var path_1 = require("path");
var StreamArray_1 = __importDefault(require("stream-json/streamers/StreamArray"));
var StreamObject_1 = __importDefault(require("stream-json/streamers/StreamObject"));
var dir_1 = require("@lib/dir");
var file_1 = require("@lib/file");
var config_1 = require("@lib/config");
var logger_1 = require("@lib/logger");
var performance_measure_1 = require("@lib/performance_measure");
var cwd = process.cwd();
var Importer = /** @class */ (function () {
    function Importer() {
        this.chunk_index = 0;
        this.state_file = path_1.join(cwd, 'imported', 'import.json');
        this.state_list_file = path_1.join(cwd, 'imported', 'import_list.json');
        this.state_global_file = path_1.join(cwd, 'imported', 'global.json');
        this.state = null;
        this.list = [];
        this.perf = config_1.Config.get('import.measure_performance') ? new performance_measure_1.Performance_Measure() : new performance_measure_1.Performance_Measure_Blank();
    }
    /**
     * import the datasets from the given filepath into `imported/data`
     * @param import_file_path path to the file which should be imported
     * @param hook_before_process the hook_before_process must return the original object or a modified version, because it will be executed before the processing of the data
     * @returns the amount of imported datasets
     */
    Importer.prototype.import = function (import_file_path, hook_before_process, hook_after_import) {
        var _this = this;
        if (hook_before_process === void 0) { hook_before_process = null; }
        this.perf.start('import');
        dir_1.Dir.create('imported/data');
        if (!this.should_import(import_file_path)) {
            var state = this.load_import_state();
            if (state) {
                logger_1.Logger.success('existing datasets', state.datasets_amount);
                this.perf.end('import');
                return state.datasets_amount;
            }
        }
        return new Promise(function (resolve, reject) {
            var jsonStream = StreamArray_1.default.withParser();
            var fileStream = fs.createReadStream(import_file_path, { flags: 'r', encoding: 'utf-8' }).pipe(jsonStream.input);
            _this.chunk_index = 0;
            var format_processed_file = config_1.Config.get('import.format_processed_file');
            jsonStream.on('data', function (data) {
                if (hook_before_process && typeof hook_before_process == 'function') {
                    data = hook_before_process(data);
                }
                _this.process(data, format_processed_file);
            });
            jsonStream.on('error', function (e) {
                reject(e);
            });
            jsonStream.on('end', function () {
                _this.save_import_state(import_file_path, _this.chunk_index);
                logger_1.Logger.success('datasets imported', _this.chunk_index);
                if (hook_after_import && typeof hook_after_import == 'function') {
                    hook_after_import();
                }
                _this.perf.end('import');
                resolve(_this.chunk_index);
            });
        });
    };
    /**
     * stores the given value as dataset on the filesystem
     * @param data data from json stream
     * @param format_processed_file
     */
    Importer.prototype.process = function (data, format_processed_file) {
        this.chunk_index++;
        if (!data || data.key == null || !data.value) {
            return;
        }
        var url = data.value.url || data.key.toString();
        var perf_mark = "import/process " + url;
        this.perf.start(perf_mark);
        var filepath = file_1.File.to_extension(file_1.File.to_index(path_1.join(cwd, 'imported', 'data', url)), '.json');
        file_1.File.create_dir(filepath);
        fs.writeFileSync(filepath, JSON.stringify(data.value, null, format_processed_file ? 4 : null));
        // add to list
        this.list.push(filepath);
        this.perf.end(perf_mark);
    };
    /**
     * get the lsit of all imported files
     * @returns list of all imported files
     */
    Importer.prototype.get_import_list = function () {
        if (this.list && this.list.length > 0) {
            return this.list;
        }
        // try to load the list from state
        var content = fs.readFileSync(this.state_list_file, { encoding: 'utf-8' });
        try {
            var list = JSON.parse(content);
            return list;
        }
        catch (e) {
            logger_1.Logger.error('can not read', this.state_list_file, e);
        }
        return null;
    };
    /**
     * Save the last import as state for next import
     * @param import_file_path path to the file which should be imported
     * @param datasets_amount amount of imported datasets
     */
    Importer.prototype.save_import_state = function (import_file_path, datasets_amount) {
        var mtimeMs = fs.statSync(import_file_path).mtimeMs;
        file_1.File.create_dir(this.state_file);
        fs.writeFileSync(this.state_file, JSON.stringify({ mtimeMs: mtimeMs, datasets_amount: datasets_amount }, null, 4));
        // persist the list
        file_1.File.create_dir(this.state_list_file);
        fs.writeFileSync(this.state_list_file, JSON.stringify(this.list, null, 4));
    };
    /**
     * Load the last import state, return null when nothing is present
     * @returns last import state
     */
    Importer.prototype.load_import_state = function () {
        if (fs.existsSync(this.state_file)) {
            try {
                var content = fs.readFileSync(this.state_file);
                var json = JSON.parse(content);
                return json;
            }
            catch (e) {
                return null;
            }
        }
        return null;
    };
    /**
     * Return whether the import file should be imported
     * @param import_file_path path to the file which should be imported
     * @returns
     */
    Importer.prototype.should_import = function (import_file_path) {
        if (!this.state) {
            var data_content = fs.readdirSync(path_1.join(cwd, 'imported', 'data'));
            if (!data_content || !Array.isArray(data_content) || data_content.length == 0) {
                logger_1.Logger.info('no imported data', 'import');
                return true;
            }
            this.state = this.load_import_state();
            var fs_stats = fs.statSync(import_file_path);
            if (this.state && fs_stats) {
                // only if modify date has changed
                if (this.state.mtimeMs == fs_stats.mtimeMs) {
                    logger_1.Logger.info('no import needed', 'unchanged');
                    return false;
                }
            }
        }
        return true;
    };
    Importer.prototype.get_global = function () {
        var _this = this;
        return new Promise(function (resolve) {
            try {
                var jsonStream = StreamObject_1.default.withParser();
                var global_data_1 = {};
                fs.createReadStream(_this.state_global_file, { flags: 'r', encoding: 'utf-8' }).pipe(jsonStream.input);
                jsonStream.on('data', function (data) {
                    global_data_1[data.key] = data.value;
                });
                jsonStream.on('error', function (e) {
                    logger_1.Logger.error('error streaming global data', e);
                    resolve(null);
                });
                jsonStream.on('end', function (data) {
                    resolve(global_data_1);
                });
            }
            catch (e) {
                logger_1.Logger.error('error reading global data', e);
                resolve(null);
            }
        });
    };
    Importer.prototype.set_global = function (global) {
        // persits the global data
        file_1.File.create_dir(this.state_global_file);
        fs.writeFileSync(this.state_global_file, JSON.stringify(global, null, 4));
    };
    return Importer;
}());
exports.Importer = Importer;
//# sourceMappingURL=importer.js.map