import 'module-alias/register';
const cluster = require('cluster');

(async () => {
    if (cluster.isMaster) {
        require('@lib/main');
    } else {
        require('@lib/worker');
    }
})();
