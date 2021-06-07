import 'module-alias/register';
import { isMaster } from 'cluster';

// console.log('argv', process.argv);
(async () => {
    if (isMaster) {
        const { Main } = require('@lib/main');
        new Main();
    } else {
        const { Worker } = require('@lib/worker');
        new Worker();
    }
})();
