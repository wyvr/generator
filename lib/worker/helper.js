const worker_status = require('_lib/model/worker/status');
const worker_action = require('_lib/model/worker/action');
module.exports = {
    send(data) {
        process.send({
            pid: process.pid,
            data,
        });
    },
    send_status(status) {
        const enum_status = this.get_status(status);
        this.send_action(worker_action.status, enum_status);
    },
    send_action(action, data) {
        this.send({
            action: {
                key: action,
                value: data
            }
        });
    },
    get_status(status) {
        let enum_status = worker_status[status];
        if (!enum_status) {
            enum_status = worker_status.exists;
        }
        if (typeof enum_status == 'string') {
            enum_status = worker_status[enum_status];
        }
        return enum_status;
    },
};
