"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerStatus = void 0;
var WorkerStatus;
(function (WorkerStatus) {
    WorkerStatus[WorkerStatus["undefined"] = 0] = "undefined";
    WorkerStatus[WorkerStatus["exists"] = 1] = "exists";
    WorkerStatus[WorkerStatus["idle"] = 2] = "idle";
    WorkerStatus[WorkerStatus["busy"] = 4] = "busy";
    WorkerStatus[WorkerStatus["dead"] = 8] = "dead";
})(WorkerStatus = exports.WorkerStatus || (exports.WorkerStatus = {}));
//# sourceMappingURL=status.js.map