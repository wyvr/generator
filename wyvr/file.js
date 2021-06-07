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
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.File = void 0;
var fs = __importStar(require("fs"));
var path_1 = require("path");
var File = /** @class */ (function () {
    function File() {
    }
    /**
     * converts the given filename to the filename with the given extension
     * @param filename
     * @param extension
     * @returns filename with the given extension
     */
    File.to_extension = function (filename, extension) {
        if (!filename || typeof filename != 'string' || !extension || typeof extension != 'string') {
            return '';
        }
        extension.trim();
        if (extension.indexOf('.') == 0) {
            extension = extension.replace(/^\./, '');
        }
        var splitted = filename.split('.');
        if (splitted.length <= 1) {
            return filename + "." + extension;
        }
        // remove last element => extension
        splitted.pop();
        return __spreadArray(__spreadArray([], splitted), [extension]).join('.');
    };
    //
    /**
     * create the directory to contain a specific file
     * @param filename
     */
    File.create_dir = function (filename) {
        var dir_path = path_1.dirname(filename);
        fs.mkdirSync(dir_path, { recursive: true });
    };
    /**
     * adds the path part index.html to the filename when it is a folder
     * @param filename
     * @param extension
     * @returns filename
     */
    File.to_index = function (filename, extension) {
        if (extension === void 0) { extension = null; }
        if (!extension) {
            extension = 'html';
        }
        var ext = extension.trim().replace(/^\./, '');
        if (!filename || typeof filename != 'string' || !filename.trim()) {
            return "index." + ext;
        }
        var parts = filename.split('/');
        var last = parts[parts.length - 1];
        if (last === '') {
            parts[parts.length - 1] = "index." + ext;
            return parts.join('/');
        }
        if (last.indexOf('.') == -1) {
            parts.push("index." + ext);
            return parts.join('/');
        }
        return filename;
    };
    /**
     * read the content of an file as json
     * @param filename
     * @returns the data of the file
     */
    File.read_json = function (filename) {
        if (!filename || !fs.existsSync(filename)) {
            return null;
        }
        var content = fs.readFileSync(filename, { encoding: 'utf8', flag: 'r' });
        if (!content) {
            return null;
        }
        var data = null;
        try {
            data = JSON.parse(content);
        }
        catch (e) {
            console.log(e);
            return null;
        }
        return data;
    };
    File.find_file = function (in_dir, possible_files) {
        var found = possible_files.find(function (file) {
            return fs.existsSync(path_1.join(in_dir, file));
        });
        if (!found) {
            return null;
        }
        return path_1.join(in_dir, found);
    };
    return File;
}());
exports.File = File;
//# sourceMappingURL=file.js.map