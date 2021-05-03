const worker_status = require("_lib/model/worker/status");
const helper = require("_lib/worker/helper");

(async () => {
    process.title = `wyvr worker generator ${process.pid}`;
    
    helper.send_status(worker_status.exists);

    process.on('uncaughtException', function(err) {
        console.error('worker PID', process.pid, 'uncaughtException', err.message, err.stack);
        process.exit(1);
    });
})();