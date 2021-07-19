require('module-alias/register');

describe('Lib/Model/Worker/Worker', () => {
    const assert = require('assert');
    const { WorkerModel } = require('@lib/model/worker/worker');
    const { WorkerStatus } = require('@lib/model/worker/status');

    /*
public status: WorkerStatus = WorkerStatus.undefined;
    public pid: number = 0;
    public process: any = null;
    constructor() {
        const instance = fork();
        this.process = instance.process;
        this.pid = instance.process.pid;
    } */
    const fork = () => {
        return {
            process: {
                pid: 1,
            },
        };
    };
    // before(() => {
    //     _fork = fork;
    //
    // });
    // after(() => {
    //     fork = _fork;
    // });

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
