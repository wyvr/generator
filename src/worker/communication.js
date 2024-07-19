import {
    get_name as get_action_name,
    WorkerAction,
} from '../struc/worker_action.js';
import {
    get_name as get_status_name,
    WorkerStatus,
} from '../struc/worker_status.js';
import { Event } from '../utils/event.js';
import { is_null, is_number } from '../utils/validate.js';
import { Env } from '../vars/env.js';

let communicate_by_ipc = true;

export function useIPC(value) {
    communicate_by_ipc = !!value;
    return communicate_by_ipc;
}

export function send(data) {
    if (communicate_by_ipc && typeof process?.send === 'function') {
        process.send({
            pid: process.pid,
            data,
        });
    } else {
        Event.emit('master', 'message', {
            pid: process.pid,
            data,
        });
    }
}
export function send_action(action, data) {
    const name = get_action_name(action);
    if (is_null(name)) {
        return false;
    }
    const data_to_send = {
        action: {
            key: action,
            value: data,
        },
    };
    // add human readable info when in debug mode
    if (Env.is_debug()) {
        data_to_send.action.key_name = name;
        if (action === WorkerAction.status) {
            data_to_send.action.value_name = get_status_name(data);
        }
    }
    send(data_to_send);
    return true;
}
export function send_status(status, action) {
    const enum_status = get_status(status);
    send_action(WorkerAction.status, { status: enum_status, action });
}
export function get_status(status) {
    if (!is_number(status)) {
        return WorkerStatus.exists;
    }
    return status;
}
