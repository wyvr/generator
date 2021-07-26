import { WorkerStatus } from '@lib/model/worker/status';
import { WorkerAction } from '@lib/model/worker/action';
import { LogType } from '@lib/model/log';

export class WorkerHelper {
    static send(data) {
        process.send({
            pid: process.pid,
            data,
        });
    }
    static send_status(status: WorkerStatus) {
        const enum_status = this.get_status(status);
        this.send_action(WorkerAction.status, enum_status);
    }
    static send_action(action: WorkerAction, data) {
        const data_to_send = {
            action: {
                key: action,
                value: data,
            },
        };
        // add human readable info when in debug mode
        if (process.env.WYVR_ENV == 'debug') {
            (<any>data_to_send).action.key_name = WorkerAction[action];
            if (action == WorkerAction.status) {
                (<any>data_to_send).action.value_name = WorkerStatus[data];
            }
        }
        this.send(data_to_send);
    }
    static get_status(status) {
        let enum_status: any = WorkerStatus[status];
        if (enum_status == null) {
            enum_status = WorkerStatus.exists;
        }
        if (typeof enum_status == 'string') {
            return WorkerStatus[enum_status];
        }
        return enum_status;
    }
    static log(type: LogType, ...messages: any[]) {
        this.send_action(WorkerAction.log, {
            type,
            messages,
        });
    }
}
