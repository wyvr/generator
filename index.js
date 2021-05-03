const cluster = require('cluster');


(async () => {
    if (cluster.isMaster) {
        require('_lib/main');
    } else {
        require('_lib/worker');
    }
})();
