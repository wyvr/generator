import { WorkerStatus } from '@lib/model/worker/status';
import { WorkerAction } from '@lib/model/worker/action';

export class WorkerHelper {
    static send(data) {
        process.send({
            pid: process.pid,
            data,
        });
    }
    static send_status(status) {
        const enum_status = this.get_status(status);
        this.send_action(WorkerAction.status, enum_status);
    }
    static send_action(action, data) {
        this.send({
            action: {
                key: action,
                value: data
            }
        });
    }
    static get_status(status) {
        let enum_status:any = WorkerStatus[status];
        if (!enum_status) {
            enum_status = WorkerStatus.exists;
        }
        if (typeof enum_status == 'string') {
            enum_status = WorkerStatus[enum_status];
        }
        return enum_status;
    }
}