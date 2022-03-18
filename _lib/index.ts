import 'module-alias/register';
import cluster from 'cluster';

/* eslint-disable */

(async () => {
    if (!cluster.isWorker) {
        const { Main } = require('@lib/main');
        new Main();
    } else {
        const { Worker } = require('@lib/worker');
        new Worker();
    }
})();

module.exports = {
    onServer: (callback) => {},
    isServer: true,
    isClient: false,
    getGlobal: (key, fallback, callback) => {},
    __: () => {},
};

/* eslint-enable */