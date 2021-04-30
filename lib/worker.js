const worker_status = require("./model/worker/status");
const helper = require("./worker/helper");

(async () => {
    process.title = `[wyvr] [worker] generator ${process.pid}`;
    
    helper.send_status(worker_status.exists);

    process.on('uncaughtException', function(err) {
        console.error('worker PID', process.pid, 'uncaughtException', err.message, err.stack);
        process.exit(1);
    });
})();