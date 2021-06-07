"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerModel = void 0;
var status_1 = require("@lib/model/worker/status");
var cluster_1 = require("cluster");
var WorkerModel = /** @class */ (function () {
    function WorkerModel() {
        this.status = status_1.WorkerStatus.undefined;
        this.pid = 0;
        this.process = null;
        var instance = cluster_1.fork();
        this.process = instance.process;
        this.pid = instance.process.pid;
    }
    return WorkerModel;
}());
exports.WorkerModel = WorkerModel;
//# sourceMappingURL=worker.js.map