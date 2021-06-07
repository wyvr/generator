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
exports.Logger = void 0;
var pkg = require('@root/package.json');
var color = __importStar(require("ansi-colors"));
var env = process.env.WYVR_ENV || 'development';
var Logger = /** @class */ (function () {
    function Logger() {
    }
    Logger.log = function () {
        var message = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            message[_i] = arguments[_i];
        }
        console.log.apply(console, message);
    };
    Logger.present = function (key) {
        var _this = this;
        var values = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            values[_i - 1] = arguments[_i];
        }
        console.log.apply(console, __spreadArray([color.dim('>'), key, color.green(values.shift())], values.map(function (m) { return _this.stringify(m); })));
    };
    Logger.info = function (key) {
        var _this = this;
        var values = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            values[_i - 1] = arguments[_i];
        }
        console.log.apply(console, __spreadArray([color.cyan('i'), key, color.cyan(values.shift())], values.map(function (m) { return _this.stringify(m); })));
    };
    Logger.success = function (key) {
        var _this = this;
        var values = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            values[_i - 1] = arguments[_i];
        }
        console.log.apply(console, __spreadArray([color.green('✓'), key, color.green(values.shift())], values.map(function (m) { return _this.stringify(m); })));
    };
    Logger.warning = function () {
        var _this = this;
        var message = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            message[_i] = arguments[_i];
        }
        var error = message.map(function (m) { return color.yellow(_this.stringify(m)); });
        console.log.apply(console, __spreadArray([color.yellow('⚠')], error));
    };
    Logger.error = function () {
        var _this = this;
        var message = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            message[_i] = arguments[_i];
        }
        var error = message.map(function (m) { return color.red(_this.stringify(m)); });
        console.log.apply(console, __spreadArray([color.red('✘')], error));
    };
    Logger.debug = function () {
        var _this = this;
        var message = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            message[_i] = arguments[_i];
        }
        if (env != 'debug') {
            return;
        }
        var error = message.map(function (m) { return color.dim(_this.stringify(m)); });
        console.log.apply(console, __spreadArray([color.dim('~')], error));
    };
    Logger.logo = function () {
        var logo = [
            "__  __  __  __  __  ____",
            "\\ \\/ /\\/ /\\/ /\\/ /\\/ /_/",
            " \\/_/\\/_/\\/ /\\/_/\\/_/",
            "         /_/ generator " + color.dim('v') + pkg.version,
        ].join('\n');
        console.log(color.cyan(logo));
        console.log('');
    };
    Logger.stringify = function (data) {
        if (typeof data == 'string' || typeof data == 'number') {
            return data.toString();
        }
        return JSON.stringify(data, null, 2);
    };
    Logger.color = color;
    return Logger;
}());
exports.Logger = Logger;
//# sourceMappingURL=logger.js.map