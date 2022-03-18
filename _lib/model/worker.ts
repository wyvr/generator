import { WorkerStatus } from '@lib/struc/worker/status';
import cluster from 'cluster';
import { ChildProcess } from 'child_process';

export class WorkerModel {
    public status: WorkerStatus = WorkerStatus.undefined;
    public pid = 0;
    public process: ChildProcess = null;
    /* eslint-disable @typescript-eslint/no-explicit-any */
    constructor(custom_fork: () => any = null) {
        const instance: any = custom_fork ? custom_fork() : cluster.fork();
        this.process = instance.process;
        this.pid = instance.process.pid;
    }
    /* eslint-enable */
}
