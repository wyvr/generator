"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Env = void 0;
var env_1 = require("@lib/model/env");
var Env = /** @class */ (function () {
    function Env() {
    }
    Env.set = function (value) {
        if (!value) {
            return this.get();
        }
        var env = value;
        // string to enum
        if (typeof value == 'string' && env_1.EnvModel[value] != null) {
            env = env_1.EnvModel[value];
        }
        // number to enum
        if (typeof value == 'number' && env_1.EnvModel[value] != null && env_1.EnvModel[env_1.EnvModel[value]] != null) {
            env = env_1.EnvModel[env_1.EnvModel[value]];
        }
        if (env) {
            this.env = env;
        }
        return this.get();
    };
    Env.get = function () {
        return this.env;
    };
    Env.is_debug = function () {
        return this.get() == env_1.EnvModel.debug || this.is_dev();
    };
    Env.is_dev = function () {
        return this.get() == env_1.EnvModel.dev;
    };
    Env.is_prod = function () {
        return this.get() == env_1.EnvModel.prod;
    };
    Env.env = env_1.EnvModel.prod;
    return Env;
}());
exports.Env = Env;
//# sourceMappingURL=env.js.map