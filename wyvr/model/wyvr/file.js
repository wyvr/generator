"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WyvrFileLoading = exports.WyvrFileRender = exports.WyvrHydrateDisplay = exports.WyvrFileConfig = exports.WyvrFile = void 0;
var path_1 = require("path");
var WyvrFile = /** @class */ (function () {
    function WyvrFile(path) {
        this.path = path;
        if (path) {
            this.name = path_1.basename(path).replace(new RegExp(path_1.extname(path).replace('.', '\\.') + "$"), '');
        }
    }
    return WyvrFile;
}());
exports.WyvrFile = WyvrFile;
var WyvrFileConfig = /** @class */ (function () {
    function WyvrFileConfig() {
        this.display = WyvrHydrateDisplay.block;
        this.render = WyvrFileRender.static;
        this.loading = WyvrFileLoading.instant;
    }
    return WyvrFileConfig;
}());
exports.WyvrFileConfig = WyvrFileConfig;
var WyvrHydrateDisplay;
(function (WyvrHydrateDisplay) {
    WyvrHydrateDisplay["inline"] = "inline";
    WyvrHydrateDisplay["block"] = "block";
})(WyvrHydrateDisplay = exports.WyvrHydrateDisplay || (exports.WyvrHydrateDisplay = {}));
var WyvrFileRender;
(function (WyvrFileRender) {
    WyvrFileRender["static"] = "static";
    WyvrFileRender["hydrate"] = "hydrate";
})(WyvrFileRender = exports.WyvrFileRender || (exports.WyvrFileRender = {}));
var WyvrFileLoading;
(function (WyvrFileLoading) {
    WyvrFileLoading["instant"] = "instant";
    WyvrFileLoading["lazy"] = "lazy";
})(WyvrFileLoading = exports.WyvrFileLoading || (exports.WyvrFileLoading = {}));
//# sourceMappingURL=file.js.map