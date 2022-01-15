require('module-alias/register');

describe('Lib/Model/Worker/Worker', () => {
    const assert = require('assert');
    const { WorkerModel } = require('@lib/struc/worker/worker');
    const { WorkerStatus } = require('@lib/struc/worker/status');

    const fork = () => {
        return {
            process: {
                pid: 1,
            },
        };
    };

    describe('WorkerModel', () => {
        it('constructor', () => {
            const worker = new WorkerModel(fork);
            assert(worker.pid !== 0);
            assert(typeof worker.pid === 'number');
            assert(worker.process != null);
            assert.strictEqual(worker.status, WorkerStatus.undefined);
        });
    });
});
