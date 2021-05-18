import 'module-alias/register';

import { isMaster } from 'cluster';
import { Main } from '@lib/main';
import { Worker } from '@lib/worker';

(async () => {
    if (isMaster) {
        new Main();
    } else {
        new Worker();
    }
})();
