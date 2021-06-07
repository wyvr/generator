"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Config = void 0;
var Config = /** @class */ (function () {
    function Config() {
    }
    /**
     * get the config value
     * @example get('path.to.the.config.value')
     * @param config_segment config to get as string, when nothing is given return the whole config
     * @returns the value or null
     */
    Config.get = function (config_segment) {
        if (config_segment === void 0) { config_segment = null; }
        if (!this.cache) {
            var raw_config = require('@config/config');
            this.cache = raw_config;
        }
        if (!config_segment || typeof config_segment != 'string') {
            return this.cache;
        }
        // load only the partial config segment
        var splitted_config_segment = config_segment.split('.');
        var shrinked_config = this.cache;
        for (var index in splitted_config_segment) {
            if (!splitted_config_segment[index] || !shrinked_config[splitted_config_segment[index]]) {
                return null;
            }
            shrinked_config = shrinked_config[splitted_config_segment[index]];
        }
        return shrinked_config;
    };
    // cached troughout the whole process
    Config.cache = null;
    return Config;
}());
exports.Config = Config;
//# sourceMappingURL=config.js.map