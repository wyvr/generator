import { WorkerAction } from '../struc/worker_action.js';
import { WorkerStatus } from '../struc/worker_status.js';
import { is_number } from '../utils/validate.js';

export function send(data) {
    process.send({
        pid: process.pid,
        data,
    });
}
export function send_complete() {
    send_status(WorkerStatus.done);
    // @TODO check memory limit, if near kill process
    send_status(WorkerStatus.idle);
}
export function send_status(status) {
    const enum_status = get_status(status);
    send_action(WorkerAction.status, enum_status);
}
export function send_action(action, data) {
    const data_to_send = {
        action: {
            key: action,
            value: data,
        },
    };
    // add human readable info when in debug mode
    // if (process.env.WYVR_ENV == 'debug') {
    //     data_to_send.action.key_name = WorkerAction[action];
    //     if (action == WorkerAction.status) {
    //         data_to_send.action.value_name = WorkerStatus[data];
    //     }
    // }
    send(data_to_send);
}
export function get_status(status) {
    if (!is_number(status)) {
        status = WorkerStatus.exists;
    }
    return status;
}
