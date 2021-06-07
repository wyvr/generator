"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerController = void 0;
var config_1 = require("@lib/config");
var status_1 = require("@lib/model/worker/status");
var action_1 = require("@lib/model/worker/action");
var logger_1 = require("@lib/logger");
var env_1 = require("@lib/env");
var worker_1 = require("@lib/model/worker/worker");
var log_1 = require("../model/log");
var WorkerController = /** @class */ (function () {
    function WorkerController(global_data) {
        this.global_data = global_data;
        this.cwd = process.cwd();
        this.workers = [];
        this.worker_ratio = config_1.Config.get('worker.ratio');
        this.listeners = {};
        this.listener_auto_increment = 0;
        this.on_entrypoint_callbacks = [];
        env_1.Env.set(process.env.WYVR_ENV);
    }
    WorkerController.prototype.get_worker_amount = function () {
        if (this.max_cores) {
            return this.max_cores;
        }
        // get amount of cores
        // at least one and left 1 core for the main worker
        var cpu_cores = require('os').cpus().length;
        var cpu_cores_ratio = Math.round(cpu_cores * this.worker_ratio);
        var max_cores = Math.max(1, cpu_cores_ratio - 1);
        // store the value
        this.max_cores = max_cores;
        return max_cores;
    };
    WorkerController.prototype.create = function () {
        var _this = this;
        var worker = new worker_1.WorkerModel();
        // creating workers and pushing reference in an array
        // these references can be used to receive messages from workers
        // to receive messages from worker process
        worker.process.on('message', function (msg) {
            logger_1.Logger.debug('process', worker.pid, 'message', msg);
            _this.get_message(msg);
        });
        worker.process.on('error', function (msg) {
            logger_1.Logger.error('process', worker.pid, 'error', msg);
        });
        worker.process.on('disconnect', function () {
            logger_1.Logger.debug('process', worker.pid, 'disconnect');
        });
        worker.process.on('exit', function (code) {
            logger_1.Logger.debug('process', worker.pid, 'exit', code);
        });
        worker.process.on('close', function (code) {
            logger_1.Logger.warning('worker died PID', worker.pid);
            logger_1.Logger.info('create new worker');
            _this.remove_worker(worker.pid);
            _this.workers.push(_this.create());
        });
        return worker;
    };
    WorkerController.prototype.remove_worker = function (pid) {
        this.workers = this.workers.filter(function (worker) { return worker.pid != pid; });
    };
    WorkerController.prototype.create_workers = function (amount) {
        this.workers = [];
        for (var i = amount; i > 0; i--) {
            this.workers.push(this.create());
        }
        return this.workers;
    };
    WorkerController.prototype.get_worker = function (pid) {
        return this.workers.find(function (worker) { return worker.pid == pid; });
    };
    WorkerController.prototype.get_message = function (msg) {
        if (typeof msg == 'string' ||
            msg.pid == null ||
            msg.data == null ||
            msg.data.action == null ||
            msg.data.action.key == null ||
            msg.data.action.value == null) {
            return;
        }
        var worker = this.get_worker(msg.pid);
        if (!worker) {
            logger_1.Logger.error('unknown worker', msg.pid);
        }
        var action = msg.data.action.key;
        var data = msg.data.action.value;
        switch (action) {
            case action_1.WorkerAction.status:
                if (typeof status_1.WorkerStatus[data] != 'string') {
                    logger_1.Logger.error('unknown state', data, 'for worker', msg.pid);
                    return;
                }
                worker.status = data;
                logger_1.Logger.present("status", status_1.WorkerStatus[data], logger_1.Logger.color.dim("PID " + msg.pid));
                break;
            case action_1.WorkerAction.log:
                if (data && data.type && log_1.LogType[data.type] && logger_1.Logger[log_1.LogType[data.type]]) {
                    // display svelte errors with better output
                    if (data.messages.length > 0 && data.messages[0] === '[svelte]') {
                        data.messages = data.messages.map(function (message, index) {
                            if (index == 0) {
                                return logger_1.Logger.color.dim(message);
                            }
                            // ssr errors
                            if (typeof message == 'object' && message.code == 'parse-error' && message.frame && message.start && message.name) {
                                return "\n" + message.name + " " + logger_1.Logger.color.dim('Line:') + message.start.line + logger_1.Logger.color.dim(' Col:') + message.start.column + "\n" + message.frame;
                            }
                            // rollup errors
                            if (typeof message == 'object' && message.code == 'PARSE_ERROR' && message.frame && message.loc) {
                                return "\n" + message.code + " " + logger_1.Logger.color.dim('in') + " " + message.loc.file + "\n" + logger_1.Logger.color.dim('Line:') + message.loc.line + logger_1.Logger.color.dim(' Col:') + message.loc.column + "\n" + message.frame;
                            }
                            return message;
                        });
                    }
                    logger_1.Logger[log_1.LogType[data.type]].apply(logger_1.Logger, __spreadArray(__spreadArray([], data.messages), [logger_1.Logger.color.dim("PID " + msg.pid)]));
                }
                break;
            case action_1.WorkerAction.emit:
                if (data.type && data.type == 'entrypoint') {
                    this.on_entrypoint_callbacks.forEach(function (fn) {
                        fn(data);
                    });
                }
                break;
        }
        this.livecycle(worker);
    };
    WorkerController.prototype.get_idle_workers = function () {
        return this.workers.filter(function (worker) { return worker.status == status_1.WorkerStatus.idle; });
    };
    WorkerController.prototype.send_status = function (pid, status) {
        logger_1.Logger.warning('really?! the status comes from the worker itself, worker:', pid, 'status', status, status_1.WorkerStatus[status]);
        this.send_action(pid, action_1.WorkerAction.status, status);
    };
    WorkerController.prototype.send_action = function (pid, action, data) {
        this.send_message(pid, {
            action: {
                key: action,
                value: data,
            },
        });
    };
    WorkerController.prototype.send_message = function (pid, data) {
        if (!pid) {
            return;
        }
        var worker = this.get_worker(pid);
        if (!worker) {
            logger_1.Logger.warning('can not send message to worker', pid);
            return;
        }
        if (!data) {
            logger_1.Logger.warning('can not send empty message to worker', pid);
            return;
        }
        worker.process.send(data);
    };
    WorkerController.prototype.livecycle = function (worker) {
        if (!worker || !worker.pid) {
            return;
        }
        if (worker.status == status_1.WorkerStatus.exists) {
            // configure the worker
            this.send_action(worker.pid, action_1.WorkerAction.configure, {
                config: config_1.Config.get(),
                env: env_1.Env.get(),
                cwd: this.cwd,
                global_data: this.global_data,
            });
        }
        this.emit(worker.status, worker);
    };
    WorkerController.prototype.on = function (status, fn) {
        var _this = this;
        if (!this.listeners || status == null || fn == null) {
            return null;
        }
        // create listener array for the status
        if (!this.listeners[status]) {
            this.listeners[status] = [];
        }
        var id = this.listener_auto_increment;
        this.listeners[status].push({ id: id, fn: fn });
        this.listener_auto_increment++;
        // check if there are worker with the given status
        this.workers.forEach(function (worker) {
            if (worker.status == status) {
                _this.emit(worker.status, worker);
            }
        });
        return id;
    };
    WorkerController.prototype.off = function (listener_id) {
        var _this = this;
        if (listener_id === void 0) { listener_id = null; }
        if (!this.listeners || listener_id == null || listener_id < 0) {
            return null;
        }
        Object.keys(this.listeners).forEach(function (listener_status) {
            _this.listeners[listener_status] = _this.listeners[listener_status].filter(function (listener) { return listener.id != listener_id; });
        });
    };
    WorkerController.prototype.emit = function (status, worker) {
        if (status == null || worker == null) {
            return;
        }
        if (!this.listeners[status]) {
            return;
        }
        this.listeners[status].forEach(function (listener) {
            if (typeof listener.fn != 'function') {
                return;
            }
            listener.fn(worker, status, listener.id);
        });
    };
    WorkerController.prototype.on_entrypoint = function (fn) {
        this.on_entrypoint_callbacks.push(fn);
    };
    return WorkerController;
}());
exports.WorkerController = WorkerController;
//# sourceMappingURL=controller.js.map