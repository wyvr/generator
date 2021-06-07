"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerHelper = void 0;
var status_1 = require("@lib/model/worker/status");
var action_1 = require("@lib/model/worker/action");
var WorkerHelper = /** @class */ (function () {
    function WorkerHelper() {
    }
    WorkerHelper.send = function (data) {
        process.send({
            pid: process.pid,
            data: data,
        });
    };
    WorkerHelper.send_status = function (status) {
        var enum_status = this.get_status(status);
        this.send_action(action_1.WorkerAction.status, enum_status);
    };
    WorkerHelper.send_action = function (action, data) {
        var data_to_send = {
            action: {
                key: action,
                value: data,
            },
        };
        // add human readable info when in debug mode
        if (process.env.WYVR_ENV == 'debug') {
            data_to_send.action.key_name = action_1.WorkerAction[action];
            if (action == action_1.WorkerAction.status) {
                data_to_send.action.value_name = status_1.WorkerStatus[data];
            }
        }
        this.send(data_to_send);
    };
    WorkerHelper.get_status = function (status) {
        var enum_status = status_1.WorkerStatus[status];
        if (!enum_status) {
            enum_status = status_1.WorkerStatus.exists;
        }
        if (typeof enum_status == 'string') {
            enum_status = status_1.WorkerStatus[enum_status];
        }
        return enum_status;
    };
    WorkerHelper.log = function (type) {
        var messages = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            messages[_i - 1] = arguments[_i];
        }
        this.send_action(action_1.WorkerAction.log, {
            type: type,
            messages: messages,
        });
    };
    return WorkerHelper;
}());
exports.WorkerHelper = WorkerHelper;
//# sourceMappingURL=helper.js.map