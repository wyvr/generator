import { Logger } from './../logger.js';
import { is_number } from './../validate.js';
import { nano_to_milli } from './../convert.js';
import { Env } from '../../vars/env.js';
import { Config } from './../config.js';

let app_performance_limit_warning;

export function log_start(req, uid) {
    if (Env.is_prod()) {
        return process.hrtime.bigint();
    }
    const date = new Date();
    Logger.debug(req.method, Logger.color.bold(req.url), date.toLocaleTimeString(), Logger.color.dim(date.toLocaleDateString()), Logger.color.dim(uid));
    return process.hrtime.bigint();
}
export function log_end(req, res, uid, start) {
    const message = [req.method, req.url, ...get_done_log_infos(res.statusMessage, res.statusCode, start, uid)];
    const type = `${res.statusCode}`[0]; // first digit indicates the type
    const type_logger = {
        1: (message) => Logger.info(...message),
        2: (message) => Logger.success(...message),
        3: (message) => Logger.warning(...message),
        4: (message) => Logger.warning(...message),
        _: (message) => Logger.error(...message)
    };
    (type_logger[type] || type_logger._)(message);
}

export function get_done_log_infos(message, status, start, uid) {
    return [`${status}${Logger.color.dim(`(${message})`)}`, ...get_time_log_infos(start, uid)];
}
export function get_time_log_infos(start = undefined, uid = undefined) {
    const date = new Date();
    const end = process.hrtime.bigint();
    let text = undefined;
    if (start) {
        const ms = nano_to_milli(end - (start ?? end));
        text = ms + Logger.color.dim('ms');
        // get the value when not already set
        if (app_performance_limit_warning === undefined) {
            app_performance_limit_warning = Config.get('worker.app_performance_limit_warning', false);
        }
        // add formating when the value is set
        if (Env.is_prod() && is_number(app_performance_limit_warning)) {
            if (ms > app_performance_limit_warning * 0.8) {
                if (ms > app_performance_limit_warning) {
                    text = Logger.color.red(`${text}(slow)`);
                } else {
                    text = Logger.color.yellow(`${text}(sluggish)`);
                }
            }
        }
    }
    return [text, date.toLocaleTimeString(), Logger.color.dim(date.toLocaleDateString()), uid ? Logger.color.dim(uid) : undefined].filter((x) => x);
}
