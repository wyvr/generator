"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerAction = void 0;
var WorkerAction;
(function (WorkerAction) {
    WorkerAction[WorkerAction["log"] = 1] = "log";
    WorkerAction[WorkerAction["status"] = 2] = "status";
    WorkerAction[WorkerAction["configure"] = 4] = "configure";
    WorkerAction[WorkerAction["emit"] = 8] = "emit";
    WorkerAction[WorkerAction["generate"] = 16] = "generate";
    WorkerAction[WorkerAction["build"] = 32] = "build";
    WorkerAction[WorkerAction["scripts"] = 64] = "scripts";
})(WorkerAction = exports.WorkerAction || (exports.WorkerAction = {}));
//# sourceMappingURL=action.js.map