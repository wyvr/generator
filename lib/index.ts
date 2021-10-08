import 'module-alias/register';
import cluster from 'cluster';

// console.log('argv', process.argv);
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
