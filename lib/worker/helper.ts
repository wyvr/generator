import { WorkerStatus } from '@lib/struc/worker/status';
import { WorkerAction } from '@lib/struc/worker/action';
import { IWorkerSend } from '@lib/interface/worker';

export class WorkerHelper {

    static send(data) {
        process.send({
            pid: process.pid,
            data,
        });
    }
    static send_complete() {
        this.send_status(WorkerStatus.done);
        // @TODO check memory limit, if near kill process
        this.send_status(WorkerStatus.idle);
    }
    static send_status(status: WorkerStatus) {
        const enum_status = this.get_status(status);
        this.send_action(WorkerAction.status, enum_status);
    }
    static send_action(action: WorkerAction, data) {
        const data_to_send: IWorkerSend = {
            action: {
                key: action,
                value: data,
            },
        };
        // add human readable info when in debug mode
        if (process.env.WYVR_ENV == 'debug') {
            data_to_send.action.key_name = WorkerAction[action];
            if (action == WorkerAction.status) {
                data_to_send.action.value_name = WorkerStatus[data];
            }
        }
        this.send(data_to_send);
    }
    static get_status(status): WorkerStatus {
        let enum_status: string | number = WorkerStatus[status];
        if (enum_status == null) {
            enum_status = WorkerStatus.exists;
        }
        if (typeof enum_status == 'string') {
            return WorkerStatus[enum_status];
        }
        return enum_status;
    }
}
