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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Link = void 0;
var fs = __importStar(require("fs-extra"));
var Link = /** @class */ (function () {
    function Link() {
    }
    /**
     * links the given source_dir_name to the pub folder
     * @param source_dir_name directory name in the root folder which gets symlinked into the pub folder
     * @param destination_name optional set the target name in the pub folder
     * @returns whether the given parameter is correct or not
     */
    Link.to_pub = function (source_dir_name, destination_name) {
        if (destination_name === void 0) { destination_name = null; }
        var cwd = process.cwd();
        if (!source_dir_name || typeof source_dir_name != 'string') {
            return false;
        }
        if (!destination_name) {
            destination_name = source_dir_name;
        }
        var trimmed_soure = source_dir_name.replace(/^\//, '');
        var trimmed_destination = destination_name.replace(/^\//, '');
        var source = cwd + "/" + trimmed_soure;
        var destination = cwd + "/pub/" + trimmed_destination;
        // create pub folder when not exists
        fs.mkdirSync(cwd + "/pub", { recursive: true });
        // when the destination exists delete it
        fs.removeSync(destination);
        // symlink from destination to source
        fs.symlinkSync(source, destination);
        return true;
    };
    /**
     * check if the path is a symbolic link
     * @param path absolute or relative path to check
     * @returns whether the given path is a symlink or not
     */
    Link.is_symlink = function (path) {
        if (!fs.existsSync(path)) {
            return false;
        }
        var stats = fs.lstatSync(path, { throwIfNoEntry: false });
        return stats.isSymbolicLink();
    };
    return Link;
}());
exports.Link = Link;
//# sourceMappingURL=link.js.map